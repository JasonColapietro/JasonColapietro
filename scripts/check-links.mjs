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
        report.fail(url, `HTTP ${result.status} — cited at ${sites}`);
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

await main();
