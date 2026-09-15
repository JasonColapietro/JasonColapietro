#!/usr/bin/env node
// Link audit for the profile surfaces.
//
// Two halves, deliberately separated:
//
//   --offline  resolvable without the network — relative paths, in-page
//              anchors, and URL hygiene. Cheap and deterministic, so it runs
//              on every pull request alongside the entity guards.
//   (default)  the above plus an HTTP probe of every external link. Needs open
//              egress, so it runs on a schedule rather than per-commit.
//
// The docs carry an explicit "last reviewed against the live destinations"
// stamp. Before this script, that date was maintained by hand and had drifted
// roughly two months behind the content date.

import { pathToFileURL } from "node:url";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { extractLinks, headingSlugs } from "./lib/markdown.mjs";
import { Report } from "./lib/report.mjs";
import { probe, toleratesBlocking } from "./lib/http.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const offline = process.argv.includes("--offline");

// Share trackers and campaign parameters turn a canonical URL into a
// session-specific one. The Instagram guard in tests/ already blocks ?igsh= on
// that one host; these are the same failure on any other.
const TRACKING = /[?&](utm_[a-z]+|igsh|igshid|fbclid|gclid|si|ref_src|ref_url)=/i;

// Hosts that answer a datacenter IP with a challenge instead of content.
//
// The first live run reported eleven failures, and nine were these: LinkedIn's
// 999, Instagram's 429, and 403s from X, Substack, Crunchbase, PitchBook and
// npm. Every one of those links works in a browser. Reporting them as broken
// is the failure this audit exists to prevent — a check that flags nine good
// links to find one bad one gets ignored, and then the real 404 rides along
// unnoticed. These are recorded as unverifiable, which is what they are: this
// runner cannot see them, and that is not evidence about the link.
const CHALLENGES_BOTS = [
  "linkedin.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "substack.com",
  "crunchbase.com",
  "pitchbook.com",
  "npmjs.com",
  "programminginsider.com",
  // Serves 404 to datacenter IPs for posts that load normally in a browser.
  // Confirmed by hand after this audit reported one as dead.
  "indiehackers.com",
  "medium.com",
  "reddit.com",
  "quora.com",
];

const challengesBots = (url) => {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return CHALLENGES_BOTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
};

/**
 * Decide what a status code means for a published link.
 *
 * The distinction that matters is "this link is gone" versus "this runner was
 * not allowed to look". Only the first is the page's problem.
 *
 * The rule for a host on the list above is that *no* client-error status from
 * it is evidence, not merely 403. Bot protection picks whichever code it is
 * configured to pick, and Indie Hackers picks 404: this audit reported one of
 * its posts as dead, and the post opens normally in a browser. Treating 404 as
 * proof of removal there produced exactly the false positive the rest of this
 * list exists to prevent, on the one status operators trust most.
 *
 * The cost is real and worth naming: a link that genuinely dies on one of
 * these hosts will now be reported as unverifiable rather than broken. That is
 * the honest answer — CI cannot see these pages — and a warning still puts it
 * in front of a person. 410 Gone is the exception, because it is an explicit,
 * deliberate "this was removed" that no protection layer emits on the way to
 * serving a challenge.
 */
export const verdictFor = (status, url) => {
  // Rate limiting is never evidence that a link is dead, on any host.
  if (status === 429) return { severity: "warn", reason: "rate-limited (HTTP 429); not checkable from CI" };
  // LinkedIn's non-standard anti-automation code.
  if (status === 999) return { severity: "warn", reason: "anti-automation challenge (HTTP 999); not checkable from CI" };

  if (challengesBots(url) && status >= 400 && status < 500 && status !== 410) {
    return {
      severity: "warn",
      reason: `HTTP ${status}; this host challenges automated clients, so the status is not evidence about the link`,
    };
  }

  return { severity: "fail", reason: `HTTP ${status}` };
};

const markdownFiles = async () => {
  const found = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".md")) found.push(full);
    }
  };
  await walk(ROOT);
  return found.sort();
};

const main = async () => {
  const report = new Report(offline ? "Link audit (offline)" : "Link audit");
  const files = await markdownFiles();

  const documents = new Map();
  for (const file of files) {
    documents.set(file, await readFile(file, "utf8"));
  }

  const links = [];
  for (const [file, text] of documents) {
    links.push(...extractLinks(text, path.relative(ROOT, file)));
  }

  // Anchor targets, indexed per document so a cross-file anchor can be checked
  // against the file it actually points at.
  const slugsByFile = new Map();
  for (const [file, text] of documents) {
    slugsByFile.set(path.relative(ROOT, file), headingSlugs(text));
  }

  const where = ({ file, line }) => `${file}:${line}`;

  for (const link of links) {
    const { url, kind } = link;

    if (kind === "external") {
      if (url.startsWith("http://")) {
        report.fail(where(link), `plain HTTP, should be https: ${url}`);
      } else if (TRACKING.test(url)) {
        report.fail(where(link), `carries a tracking parameter: ${url}`);
      } else {
        report.pass(where(link), url);
      }
      continue;
    }

    if (kind === "anchor") {
      const slug = decodeURIComponent(url.slice(1)).toLowerCase();
      const own = slugsByFile.get(link.file);
      if (own?.has(slug)) report.pass(where(link), url);
      else report.fail(where(link), `anchor has no matching heading in ${link.file}: ${url}`);
      continue;
    }

    if (kind === "relative") {
      const [target, fragment] = decodeURIComponent(url).split("#");
      const resolved = path.resolve(ROOT, path.dirname(link.file), target);
      try {
        await stat(resolved);
      } catch {
        report.fail(where(link), `relative path does not exist: ${url}`);
        continue;
      }
      if (fragment) {
        const key = path.relative(ROOT, resolved);
        const slugs = slugsByFile.get(key);
        if (slugs && !slugs.has(fragment.toLowerCase())) {
          report.fail(where(link), `anchor has no matching heading in ${key}: #${fragment}`);
          continue;
        }
      }
      report.pass(where(link), url);
      continue;
    }

    if (kind === "mailto") {
      const address = url.slice("mailto:".length);
      if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(address)) report.pass(where(link), url);
      else report.fail(where(link), `malformed mailto: ${url}`);
    }
  }

  if (offline) {
    console.log(`Checked ${links.length} links across ${files.length} files (no network).`);
    process.exit(report.emit());
  }

  // Online half: one probe per distinct external URL, not per occurrence.
  const external = [...new Set(links.filter((l) => l.kind === "external").map((l) => l.url))].sort();
  const occurrences = new Map();
  for (const link of links.filter((l) => l.kind === "external")) {
    occurrences.set(link.url, [...(occurrences.get(link.url) ?? []), where(link)]);
  }

  console.log(`Probing ${external.length} distinct external URLs...`);

  const LIMIT = 8;
  let blocked = 0;

  for (let i = 0; i < external.length; i += LIMIT) {
    const batch = external.slice(i, i + LIMIT);
    const results = await Promise.all(batch.map((url) => probe(url, { method: "GET" })));

    for (const [index, result] of results.entries()) {
      const url = batch[index];
      const sites = occurrences.get(url).join(", ");

      if (result.blocked) {
        blocked += 1;
        report.add(
          toleratesBlocking() ? "warn" : "fail",
          url,
          `not reachable from this environment (egress policy) — cited at ${sites}`,
        );
      } else if (result.status === 0) {
        report.fail(url, `no response (${result.error?.message ?? "unknown error"}) — cited at ${sites}`);
      } else if (!result.ok) {
        const { severity, reason } = verdictFor(result.status, url);
        report.add(severity, url, `${reason} — cited at ${sites}`);
      } else if (result.redirected && result.finalUrl !== url) {
        // Not a failure: a redirect that resolves still works. It is a warning
        // because the published URL is no longer the canonical one.
        report.warn(url, `redirects to ${result.finalUrl} — cited at ${sites}`);
      } else {
        report.pass(url, sites);
      }
    }
  }

  if (blocked > 0 && toleratesBlocking()) {
    console.log(`\n${blocked} URLs were unreachable because this environment blocks them, not because they are down.`);
  }

  process.exit(report.emit());
};

// Only run when invoked directly. These modules export rules the test suite
// imports, and a top-level `await main()` would run a full network audit —
// and then call process.exit — the moment a test imported one. That is not a
// hypothetical: it silently killed the runner mid-suite, and the test that
// triggered it disappeared from the results rather than failing.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
