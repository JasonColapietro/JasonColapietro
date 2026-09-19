#!/usr/bin/env node
// Reconcile the README's numeric claims against what GitHub actually reports.
//
// The guards in tests/ prove the numbers on the page agree with each other.
// This proves they agree with reality. It is deliberately not part of the
// per-commit CI: upstream merges land on someone else's schedule, so a hard
// failure here would turn a green repository red for something no commit did.
// It runs on a schedule and reports drift, and only fails when a claim can no
// longer be found at all — which means the page structure changed under the
// guards.

import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Report } from "./lib/report.mjs";
import { probeJson } from "./lib/http.mjs";
import { drift, skillsClaim, upstreamClaim } from "./lib/claims.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
const AUTH = TOKEN ? { authorization: `Bearer ${TOKEN}` } : {};

// The same query the README's badge links to, so the page and the check are
// counting the same population by construction.
const UPSTREAM_QUERY =
  "is:pr author:JasonColapietro author:Suede-AI is:merged -user:JasonColapietro -user:Suede-AI";

/** Every search hit, paged out, so distinct repositories can be counted. */
const searchAll = async (query) => {
  const items = [];
  let total = null;

  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=100&page=${page}`;
    const result = await probeJson(url, { headers: { accept: "application/vnd.github+json", ...AUTH } });

    if (!result.ok) {
      return { total, items, error: result.blocked ? "blocked by this environment's egress policy" : `HTTP ${result.status}` };
    }

    total ??= result.json.total_count;
    items.push(...(result.json.items ?? []));
    if (items.length >= total || (result.json.items ?? []).length === 0) break;
  }

  return { total, items, error: null };
};

/** A pull request's repository, taken from its API URL. */
const repoOf = (item) => {
  const match = /repos\/([^/]+\/[^/]+)\/issues\//.exec(item.repository_url ? `${item.repository_url}/issues/` : "");
  return match?.[1] ?? null;
};

const main = async () => {
  const report = new Report("Numeric claims vs GitHub");
  const readme = await readFile(new URL("README.md", `file://${ROOT}`), "utf8");

  if (!TOKEN) {
    report.warn("authentication", "no GITHUB_TOKEN set; the search API allows only a few unauthenticated requests per minute");
  }

  // --- Upstream merges ------------------------------------------------------
  const claim = upstreamClaim(readme);
  if (!claim) {
    report.fail("README", "could not find the upstream-merge badge; the page structure changed");
  } else {
    const { total, items, error } = await searchAll(UPSTREAM_QUERY);

    if (error) {
      report.warn("upstream merges", `could not query GitHub: ${error}`);
    } else {
      const prDrift = drift(claim.prs, total, "upstream merged PRs");
      report.add(prDrift.severity, prDrift.message);

      const repos = new Set(items.map(repoOf).filter(Boolean));
      // Only trust the distinct-repo count when paging actually returned
      // everything; a truncated page would undercount and read as overstatement.
      if (items.length >= total) {
        const repoDrift = drift(claim.repos, repos.size, "distinct upstream repositories");
        report.add(repoDrift.severity, repoDrift.message);
      } else {
        report.warn("distinct upstream repositories", `only ${items.length} of ${total} results were retrieved; not comparing`);
      }

      if (claim.substantive !== null && claim.substantive + claim.listings !== claim.prs) {
        report.fail("upstream split", `${claim.substantive} + ${claim.listings} does not equal ${claim.prs}`);
      }
      if (claim.asOf) {
        report.pass("claim date", `the page dates the upstream claim to ${claim.asOf}`);
      }
    }
  }

  // --- Skill pack -----------------------------------------------------------
  const skills = skillsClaim(readme);
  if (skills === null) {
    report.fail("README", "could not find the open-source skills badge");
  } else {
    // Counted from the pack's own contents rather than from a release note, so
    // the number reflects what someone installing it actually gets.
    const tree = await probeJson(
      "https://api.github.com/repos/JasonColapietro/suede-creator-skills/contents/skills",
      { headers: { accept: "application/vnd.github+json", ...AUTH } },
    );

    if (!tree.ok) {
      report.warn("skill pack", tree.blocked ? "blocked by this environment's egress policy" : `could not list the pack: HTTP ${tree.status}`);
    } else if (!Array.isArray(tree.json)) {
      report.warn("skill pack", "the skills/ path did not return a directory listing; the pack layout may have changed");
    } else {
      const actual = tree.json.filter((entry) => entry.type === "dir").length;
      const skillDrift = drift(skills, actual, "open-source skills");
      report.add(skillDrift.severity, skillDrift.message);
    }
  }

  // Drift is information, not a build break; a claim that can no longer be
  // found is a build break, because it means the page moved out from under the
  // guards. emit() prints and writes the job summary, so nothing else should.
  const structural = report.findings.some((f) => f.severity === "fail" && f.subject === "README");
  report.emit({ quiet: false });
  process.exit(structural ? 1 : 0);
};

// Only run when invoked directly. These modules export rules the test suite
// imports, and a top-level `await main()` would run a full network audit —
// and then call process.exit — the moment a test imported one. That is not a
// hypothetical: it silently killed the runner mid-suite, and the test that
// triggered it disappeared from the results rather than failing.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
