#!/usr/bin/env node
// Runtime canary for the Suede agent interfaces.
//
// docs/Suede Labs AI.md and docs/Public Links.md both say, in their own words,
// that "a manifest entry documents what is advertised, not that a call will
// succeed", and that "runtime success requires a separate canary". This is that
// canary.
//
// What it establishes, in order:
//   1. the x402 manifest and the A2A agent card are reachable and parse;
//   2. each advertised resource carries payment terms a client could act on;
//   3. each advertised resource, called without payment, actually answers 402 —
//      a 200 means the resource is not gated, a 404 means it is advertised but
//      not deployed;
//   4. the terms in that live 402 match the terms the manifest advertises.
//
// Step 4 is the one nothing else covers. A price changed at the edge while the
// manifest kept the old number reads as correct from either side alone.

import { Report } from "./lib/report.mjs";
import { probe, probeJson, toleratesBlocking } from "./lib/http.mjs";
import {
  acceptsOf,
  compareTerms,
  resourceUrl,
  validateAgentCard,
  validateManifest,
} from "./lib/x402.mjs";

const MANIFEST = process.env.X402_MANIFEST_URL ?? "https://app.suedeai.ai/.well-known/x402.json";
const AGENT_CARD = process.env.A2A_CARD_URL ?? "https://app.suedeai.ai/.well-known/agent-card.json";

const record = (report, problems) => {
  for (const { severity, message } of problems) report.add(severity, message);
};

// A blocked host is a warning when a local egress policy caused it, and a real
// failure in CI, where nothing should be standing between the job and the host.
const blockedSeverity = toleratesBlocking() ? "warn" : "fail";

const main = async () => {
  const report = new Report("x402 / A2A runtime canary");

  // --- The agent card -------------------------------------------------------
  const card = await probeJson(AGENT_CARD);
  if (card.blocked) {
    report.add(blockedSeverity, AGENT_CARD, "not reachable from this environment (egress policy)");
  } else if (!card.ok) {
    report.fail(AGENT_CARD, card.parseError ? `served invalid JSON: ${card.parseError.message}` : `HTTP ${card.status}`);
  } else {
    report.pass(AGENT_CARD, `HTTP ${card.status}`);
    record(report, validateAgentCard(card.json));
  }

  // --- The manifest ---------------------------------------------------------
  const manifest = await probeJson(MANIFEST);
  if (manifest.blocked) {
    report.add(blockedSeverity, MANIFEST, "not reachable from this environment (egress policy)");
    const code = report.emit();
    if (toleratesBlocking()) {
      console.log("\nThis environment cannot reach the Suede hosts, so nothing was proven about them.");
      console.log("Run this in CI, or anywhere with open egress, for a real result.");
    }
    process.exit(code);
  }

  if (!manifest.ok) {
    report.fail(MANIFEST, manifest.parseError ? `served invalid JSON: ${manifest.parseError.message}` : `HTTP ${manifest.status}`);
    process.exit(report.emit());
  }

  report.pass(MANIFEST, `HTTP ${manifest.status}`);
  const { resources, problems } = validateManifest(manifest.json);
  record(report, problems);

  // --- Each advertised resource, at runtime ---------------------------------
  for (const resource of resources) {
    const url = resourceUrl(resource);
    if (!url || !/^https?:\/\//.test(url)) continue;

    const advertised = acceptsOf(resource)[0];
    // Deliberately unpaid: the correct answer for a gated resource is 402 with
    // the terms attached, and that response is what we compare against.
    const result = await probe(url, { method: "GET", retries: 1 });

    if (result.blocked) {
      report.add(blockedSeverity, url, "not reachable from this environment (egress policy)");
      continue;
    }

    if (result.status === 402) {
      report.pass(url, "gated, answers 402 as advertised");

      let live;
      try {
        live = await result.response.json();
      } catch (error) {
        report.fail(url, `402 body is not JSON, so a client cannot read the terms: ${error.message}`);
        continue;
      }

      const liveAccepts = acceptsOf(live);
      if (liveAccepts.length === 0) {
        report.fail(url, "402 response carries no payment requirements");
      } else if (advertised) {
        record(report, compareTerms(advertised, liveAccepts[0], url));
      }
      continue;
    }

    if (result.status === 200) {
      report.fail(url, "advertised as paid but returns 200 without payment — the resource is not gated");
    } else if (result.status === 404) {
      report.fail(url, "advertised in the manifest but not deployed (404)");
    } else if (result.status === 0) {
      report.fail(url, `no response (${result.error?.message ?? "unknown error"})`);
    } else {
      report.fail(url, `expected 402, got HTTP ${result.status}`);
    }
  }

  process.exit(report.emit());
};

await main();
