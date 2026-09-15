#!/usr/bin/env node
// Agent-readability audit for the live Suede surfaces.
//
// The profile documents in this repository are written to be resolved by
// models and crawlers, not just read by people. That only pays off if the live
// surfaces assert the same identity: the same canonical name, the same alias,
// the same sameAs set, the same founder relation. A surface that disagrees
// splits the entity instead of confirming it — which is the exact failure the
// Jay Colapietro and Instagram guards in tests/ exist to prevent locally.
//
// Checks, per surface:
//   - the page responds and serves HTML;
//   - its JSON-LD parses (a block that does not parse is invisible to every
//     consumer while still looking annotated in the source);
//   - it declares the entity types it should;
//   - its sameAs URLs are a subset of the canonical set in Public Links.md;
//   - llms.txt is present where a surface claims to serve agents.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Report } from "./lib/report.mjs";
import { probe, toleratesBlocking } from "./lib/http.mjs";
import {
  canonicalIdentityUrls,
  extractJsonLd,
  flattenNodes,
  nodesOfType,
  sameAsUrls,
} from "./lib/structured.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Each surface states what it is expected to assert. `person` and
// `organization` are the schema.org types the page should carry; `llms` marks
// the surfaces that advertise themselves to agents and should therefore serve
// an llms.txt.
const SURFACES = [
  { url: "https://suedeai.ai", organization: true, llms: true },
  { url: "https://suedeai.ai/founder", person: true },
  { url: "https://suedeai.org", organization: true },
  { url: "https://jasoncolapietro.com", person: true, llms: true },
  { url: "https://johnnysuede.com", person: true },
  { url: "https://app.suedeai.ai/developers", llms: true },
];

const main = async () => {
  const report = new Report("Entity and agent-readability audit");
  const publicLinks = await readFile(new URL("docs/Public Links.md", `file://${ROOT}`), "utf8");
  const canonical = canonicalIdentityUrls(publicLinks);
  const blockedSeverity = toleratesBlocking() ? "warn" : "fail";

  report.pass("canonical identity set", `${canonical.size} URLs read from docs/Public Links.md`);

  for (const surface of SURFACES) {
    const result = await probe(surface.url, { method: "GET", retries: 1 });

    if (result.blocked) {
      report.add(blockedSeverity, surface.url, "not reachable from this environment (egress policy)");
      continue;
    }
    if (!result.ok) {
      report.fail(surface.url, result.status === 0 ? `no response (${result.error?.message ?? "unknown"})` : `HTTP ${result.status}`);
      continue;
    }

    const html = await result.response.text();
    report.pass(surface.url, `HTTP ${result.status}`);

    const blocks = extractJsonLd(html);
    if (blocks.length === 0) {
      report.warn(surface.url, "serves no JSON-LD, so the entity is not machine-resolvable from this page");
      continue;
    }

    const broken = blocks.filter((block) => !block.ok);
    for (const block of broken) {
      report.fail(surface.url, `a JSON-LD block does not parse (${block.error}); consumers see nothing: ${block.raw}`);
    }

    const nodes = blocks.filter((block) => block.ok).flatMap((block) => flattenNodes(block.data));

    if (surface.person && nodesOfType(nodes, "Person").length === 0) {
      report.warn(surface.url, "declares no schema.org Person node");
    }
    if (surface.organization && nodesOfType(nodes, "Organization").length === 0) {
      report.warn(surface.url, "declares no schema.org Organization node");
    }

    // A sameAs pointing somewhere this repository does not recognise is either
    // a surface we forgot to document or an identity claim we did not make.
    const asserted = sameAsUrls(nodes);
    const unknown = [...asserted].filter((url) => !canonical.has(url));
    if (unknown.length > 0) {
      report.warn(surface.url, `asserts sameAs URLs absent from docs/Public Links.md: ${unknown.join(", ")}`);
    } else if (asserted.size > 0) {
      report.pass(surface.url, `${asserted.size} sameAs URLs, all documented`);
    }

    if (surface.llms) {
      const origin = new URL(surface.url).origin;
      const llms = await probe(`${origin}/llms.txt`, { method: "GET", retries: 0 });
      if (llms.blocked) report.add(blockedSeverity, `${origin}/llms.txt`, "not reachable from this environment");
      else if (llms.ok) report.pass(`${origin}/llms.txt`, `HTTP ${llms.status}`);
      else report.warn(`${origin}/llms.txt`, `absent (HTTP ${llms.status}) on a surface that advertises itself to agents`);
    }
  }

  const code = report.emit();
  if (toleratesBlocking() && report.findings.some((f) => f.detail?.includes("egress policy"))) {
    console.log("\nThis environment cannot reach the Suede hosts, so nothing was proven about them.");
    console.log("Run this in CI, or anywhere with open egress, for a real result.");
  }
  process.exit(code);
};

await main();
