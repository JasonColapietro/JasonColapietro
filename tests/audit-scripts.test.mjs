import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";

import { classify, extractLinks, headingSlugs, slugify } from "../scripts/lib/markdown.mjs";
import { Report } from "../scripts/lib/report.mjs";
import { probe } from "../scripts/lib/http.mjs";
import {
  acceptsOf,
  compareTerms,
  resourceUrl,
  resourcesOf,
  validateAccept,
  validateAgentCard,
  validateManifest,
} from "../scripts/lib/x402.mjs";
import { drift, skillsClaim, upstreamClaim } from "../scripts/lib/claims.mjs";
import {
  canonicalIdentityUrls,
  canonicalLink,
  extractJsonLd,
  flattenNodes,
  nodesOfType,
  sameAsUrls,
} from "../scripts/lib/structured.mjs";

// The audit scripts reach hosts that this repository's own CI can reach but a
// sandboxed contributor environment cannot. That makes their pure rules the
// part that has to be covered here: a checker whose network half is unrunnable
// and whose logic is untested is a checker nobody should trust when it
// eventually reports green.

const severities = (problems) => problems.map((p) => p.severity);
const messages = (problems) => problems.map((p) => p.message).join(" | ");

test("link extraction finds every link form the profile surfaces actually use", () => {
  const md = [
    "# Heading",
    "A [markdown link](https://example.com/a) and a [relative one](./docs/Thing.md).",
    '<p><a href="https://example.com/b"><img src="assets/x.png" alt="x"></a></p>',
    "An autolink <https://example.com/c> and an anchor [jump](#heading).",
    "Mail me at [here](mailto:jason@suedeai.ai).",
  ].join("\n");

  const links = extractLinks(md, "README.md");
  const urls = links.map((l) => l.url);

  assert.ok(urls.includes("https://example.com/a"), "markdown inline link");
  assert.ok(urls.includes("./docs/Thing.md"), "relative link");
  assert.ok(urls.includes("https://example.com/b"), "html href");
  assert.ok(urls.includes("assets/x.png"), "html src");
  assert.ok(urls.includes("https://example.com/c"), "autolink");
  assert.ok(urls.includes("#heading"), "anchor");
  assert.ok(urls.includes("mailto:jason@suedeai.ai"), "mailto");

  // Line numbers are what makes a finding actionable rather than a scavenger hunt.
  assert.equal(links.find((l) => l.url === "https://example.com/a").line, 2);
});

test("link extraction ignores URLs that are documentation rather than references", () => {
  const md = ["Real: <https://example.com/real>", "```", "curl https://example.com/fenced", "```"].join("\n");
  const urls = extractLinks(md, "README.md").map((l) => l.url);

  assert.ok(urls.includes("https://example.com/real"));
  assert.ok(!urls.includes("https://example.com/fenced"), "a URL inside a fenced block is an example, not a link");
});

test("links are classified by how they can be resolved", () => {
  assert.equal(classify("https://example.com"), "external");
  assert.equal(classify("http://example.com"), "external");
  assert.equal(classify("#apps"), "anchor");
  assert.equal(classify("mailto:a@b.co"), "mailto");
  assert.equal(classify("./docs/Thing.md"), "relative");
  assert.equal(classify("assets/x.png"), "relative");
  assert.equal(classify("ipfs://cid"), "other");
});

test("heading slugs match how an in-page anchor actually resolves", () => {
  assert.equal(slugify("What I am building"), "what-i-am-building");
  assert.equal(slugify("Programs and recognition"), "programs-and-recognition");
  assert.equal(slugify("Apps & Tools!"), "apps--tools");

  // GitHub disambiguates repeated headings, and the changelog repeats month
  // headings across years, so the suffix behaviour is load-bearing here.
  const slugs = headingSlugs(["# Apps", "## Apps", "### Other"].join("\n"));
  assert.deepEqual([...slugs].sort(), ["apps", "apps-1", "other"]);
});

test("the offline link rules catch the failures they exist for", () => {
  // Guarding against a vacuous pass: the audit reported 374 clean links on this
  // repository, which is only reassuring if a dirty link would have been caught.
  const md = [
    "# Title",
    "[tracker](https://www.instagram.com/suedeai?igsh=abc123)",
    "[insecure](http://example.com)",
    "[missing anchor](#no-such-heading)",
  ].join("\n");

  const TRACKING = /[?&](utm_[a-z]+|igsh|igshid|fbclid|gclid|si|ref_src|ref_url)=/i;
  const links = extractLinks(md, "README.md");
  const slugs = headingSlugs(md);

  assert.ok(TRACKING.test(links.find((l) => l.url.includes("igsh")).url), "share tracker is detected");
  assert.ok(links.find((l) => l.url.startsWith("http://")), "plain HTTP is detected");
  assert.ok(!slugs.has("no-such-heading"), "a dangling anchor has no matching heading");
});

// --- x402 -------------------------------------------------------------------

const GOOD_ACCEPT = {
  scheme: "exact",
  network: "base",
  maxAmountRequired: "10000",
  payTo: "0x1234567890abcdef1234567890ABCDEF12345678",
  asset: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
};

test("the manifest resource list is found under every serialization it has used", () => {
  assert.equal(resourcesOf([{ resource: "https://x/y" }]).shape, "array");
  assert.equal(resourcesOf({ resources: [] }).shape, "resources");
  assert.equal(resourcesOf({ items: [] }).shape, "items");

  // An unrecognised shape must not read as an empty manifest: iterating nothing
  // would let a canary report success while proving nothing at all.
  const unknown = resourcesOf({ data: { things: [] } });
  assert.equal(unknown.shape, "unrecognised");
  assert.equal(unknown.resources, null);

  const { problems } = validateManifest({ data: {} });
  assert.deepEqual(severities(problems), ["fail"]);
  assert.match(messages(problems), /no recognisable resource list/);
});

test("a payment requirement missing what a client needs is a failure, not a warning", () => {
  assert.deepEqual(validateAccept(GOOD_ACCEPT, "r"), []);

  for (const field of ["scheme", "network", "maxAmountRequired", "payTo", "asset"]) {
    const broken = { ...GOOD_ACCEPT, [field]: undefined };
    const problems = validateAccept(broken, "r");
    assert.ok(problems.some((p) => p.severity === "fail" && p.message.includes(field)), `missing ${field} must fail`);
  }
});

test("x402 amounts are atomic-unit strings, and addresses are well formed", () => {
  // A float price is the classic x402 integration bug: it looks right in the
  // manifest and rounds wrong at settlement.
  const asNumber = validateAccept({ ...GOOD_ACCEPT, maxAmountRequired: 0.01 }, "r");
  assert.deepEqual(severities(asNumber), ["warn"]);
  assert.match(messages(asNumber), /atomic-unit string/);

  const asDecimalString = validateAccept({ ...GOOD_ACCEPT, maxAmountRequired: "0.01" }, "r");
  assert.deepEqual(severities(asDecimalString), ["fail"]);

  const badAddress = validateAccept({ ...GOOD_ACCEPT, payTo: "0xdeadbeef" }, "r");
  assert.deepEqual(severities(badAddress), ["fail"]);
  assert.match(messages(badAddress), /well-formed address/);

  // A non-EVM payTo should not be held to an EVM address shape.
  assert.deepEqual(validateAccept({ ...GOOD_ACCEPT, payTo: "solana:abc", asset: "usdc" }, "r"), []);
});

test("a resource advertised with no way to pay for it is reported", () => {
  const { problems } = validateManifest({
    x402Version: 1,
    resources: [{ resource: "https://app.suedeai.ai/api/music", accepts: [] }],
  });

  assert.ok(problems.some((p) => p.severity === "fail" && /no payment requirements/.test(p.message)));
});

test("resource URLs are read from whichever field carries them", () => {
  assert.equal(resourceUrl({ resource: "https://a/1" }), "https://a/1");
  assert.equal(resourceUrl({ url: "https://a/2" }), "https://a/2");
  assert.equal(resourceUrl({ accepts: [{ resource: "https://a/3" }] }), "https://a/3");
  assert.equal(resourceUrl({}), null);
  assert.equal(acceptsOf({ paymentRequirements: [GOOD_ACCEPT] }).length, 1);
});

test("a clean manifest produces no findings", () => {
  const { resources, problems } = validateManifest({
    x402Version: 1,
    resources: [
      { resource: "https://app.suedeai.ai/api/music", accepts: [GOOD_ACCEPT] },
      { resource: "https://app.suedeai.ai/api/image", accepts: [GOOD_ACCEPT] },
    ],
  });

  assert.equal(resources.length, 2);
  assert.deepEqual(problems, []);
});

test("price drift between the manifest and the live 402 is the finding nothing else catches", () => {
  // The whole reason this canary exists: docs/Suede Labs AI.md says a manifest
  // entry documents what is advertised, not that a call will succeed. A price
  // changed at the edge reads as correct from either side alone.
  const live = { ...GOOD_ACCEPT, maxAmountRequired: "50000" };
  const problems = compareTerms(GOOD_ACCEPT, live, "https://app.suedeai.ai/api/music");

  assert.deepEqual(severities(problems), ["fail"]);
  assert.match(messages(problems), /advertises amount 10000 but the live 402 returns 50000/);

  assert.deepEqual(compareTerms(GOOD_ACCEPT, { ...GOOD_ACCEPT }, "r"), [], "matching terms produce no findings");

  const networkDrift = compareTerms(GOOD_ACCEPT, { ...GOOD_ACCEPT, network: "base-sepolia" }, "r");
  assert.match(messages(networkDrift), /network base but the live 402 returns base-sepolia/);
});

test("an A2A agent card is held to the fields a conforming client requires", () => {
  const card = {
    name: "Suede",
    description: "Creator ownership infrastructure",
    url: "https://app.suedeai.ai",
    version: "1.0.0",
    capabilities: {},
    skills: [{ id: "license", name: "License", description: "License a work" }],
  };
  assert.deepEqual(validateAgentCard(card), []);

  for (const field of ["name", "description", "url", "version"]) {
    const problems = validateAgentCard({ ...card, [field]: undefined });
    assert.ok(problems.some((p) => p.severity === "fail" && p.message.includes(field)));
  }

  assert.ok(validateAgentCard({ ...card, url: "http://app.suedeai.ai" }).some((p) => /not https/.test(p.message)));
  assert.ok(validateAgentCard({ ...card, skills: [] }).some((p) => /no skills/.test(p.message)));
});

// --- Claims -----------------------------------------------------------------

test("the README's numeric claims are read back out of the page", async () => {
  const readme = await (await import("node:fs/promises")).readFile(new URL("../README.md", import.meta.url), "utf8");
  const claim = upstreamClaim(readme);

  assert.ok(claim, "the upstream badge must be findable");
  assert.equal(typeof claim.prs, "number");
  assert.equal(typeof claim.repos, "number");
  assert.equal(claim.substantive + claim.listings, claim.prs, "the split must sum to the total");
  assert.equal(typeof skillsClaim(readme), "number");
});

test("overstating a count is louder than understating one", () => {
  // On a page whose purpose is verifiable evidence, a claim larger than reality
  // is a different kind of problem from one that is merely out of date.
  assert.equal(drift(44, 44, "x").severity, "pass");
  assert.equal(drift(44, 46, "x").severity, "warn", "understated is a missed update");
  assert.equal(drift(44, 42, "x").severity, "fail", "overstated is an inaccurate public claim");
  assert.match(drift(44, 42, "x").message, /overstated by 2/);
  assert.equal(drift(null, 42, "x").severity, "warn");
  assert.equal(drift(44, NaN, "x").severity, "warn");
});

// --- Structured data --------------------------------------------------------

test("JSON-LD that does not parse is reported rather than skipped", () => {
  const html = `
    <script type="application/ld+json">{"@type":"Person","name":"Jason Colapietro"}</script>
    <script type="application/ld+json">{"@type":"Organization",}</script>
  `;
  const blocks = extractJsonLd(html);

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].ok, true);
  // A block that looks annotated in the source and is invisible to consumers is
  // the most valuable thing this audit can find, so it must not be dropped.
  assert.equal(blocks[1].ok, false);
  assert.ok(blocks[1].error);
});

test("entity nodes are found through @graph containers and array types", () => {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": ["Person", "Author"], name: "Jason Colapietro", sameAs: ["https://x.com/johnnysuede/"] },
      { "@type": "Organization", name: "Suede Labs AI", sameAs: "https://suedeai.ai" },
    ],
  };
  const nodes = flattenNodes(data);

  assert.equal(nodes.length, 2);
  assert.equal(nodesOfType(nodes, "Person").length, 1, "an array-valued @type still matches");
  assert.equal(nodesOfType(nodes, "organization").length, 1, "type matching is case-insensitive");

  // Trailing slashes are a rendering detail, not a different identity.
  const urls = sameAsUrls(nodes);
  assert.ok(urls.has("https://x.com/johnnysuede"));
  assert.ok(urls.has("https://suedeai.ai"));
});

test("the canonical identity set comes from Public Links, not from the checker", async () => {
  const md = await (await import("node:fs/promises")).readFile(
    new URL("../docs/Public Links.md", import.meta.url),
    "utf8",
  );
  const urls = canonicalIdentityUrls(md);

  assert.ok(urls.has("https://johnnysuede.com"), "the creative identity site is an identity URL");
  assert.ok(urls.has("https://x.com/johnnysuede"));
  assert.ok(urls.has("https://www.instagram.com/suedeai"));

  // The machine-readable endpoints are evidence, not identity assertions, and a
  // surface listing them under sameAs would be making a different claim.
  assert.ok(!urls.has("https://ip.suedeai.ai"), "registry endpoints are not identity URLs");
  assert.ok(![...urls].some((u) => u.includes("img.shields.io")), "badge images are never identity URLs");
});

test("a canonical link is read from either attribute order", () => {
  assert.equal(canonicalLink('<link rel="canonical" href="https://suedeai.ai/">'), "https://suedeai.ai/");
  assert.equal(canonicalLink('<link href="https://suedeai.ai/" rel="canonical">'), "https://suedeai.ai/");
  assert.equal(canonicalLink("<p>nothing</p>"), null);
});

// --- Reporting and transport ------------------------------------------------

test("the report's exit code fails on failures and tolerates warnings", () => {
  assert.equal(new Report("t").pass("a").worst(), "pass");
  assert.equal(new Report("t").pass("a").warn("b").worst(), "warn");
  assert.equal(new Report("t").warn("b").fail("c").worst(), "fail");

  const report = new Report("t").pass("a").warn("b").fail("c");
  assert.deepEqual(report.counts(), { pass: 1, warn: 1, fail: 1 });

  // A pipe inside a URL must not break the job-summary table.
  const markdown = new Report("t").fail("https://x/a|b", "detail|here").toMarkdown();
  assert.ok(markdown.includes("https://x/a\\|b"));
});

test("a probe reports transport outcomes without throwing", async () => {
  let hits = 0;
  const server = createServer((req, res) => {
    hits += 1;
    if (req.url === "/ok") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"hello":"world"}');
    } else if (req.url === "/flaky") {
      // Fails once, then succeeds: the retry must absorb it.
      res.writeHead(hits < 2 ? 503 : 200).end("x");
    } else if (req.url === "/denied") {
      res.writeHead(403, { "x-deny-reason": "host_not_allowed" }).end("Host not in allowlist: example.com.");
    } else {
      res.writeHead(404).end("no");
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const ok = await probe(`${base}/ok`);
    assert.equal(ok.ok, true);
    assert.equal(ok.status, 200);

    const missing = await probe(`${base}/missing`, { retries: 0 });
    assert.equal(missing.ok, false);
    assert.equal(missing.status, 404);
    assert.equal(missing.blocked, undefined, "a 404 is the origin answering, not a policy denial");

    hits = 0;
    const flaky = await probe(`${base}/flaky`, { retries: 2 });
    assert.equal(flaky.ok, true, "a single 503 must be retried rather than reported as dead");

    // The failure mode this cost a debugging round to find: the egress proxy
    // answers the request itself with a 403 instead of refusing the tunnel, so
    // a denial arrives as an ordinary response and reads as the origin
    // rejecting us. Treating that as a site failure is a false alarm, and a
    // canary that cries wolf gets muted.
    const denied = await probe(`${base}/denied`, { retries: 0 });
    assert.equal(denied.blocked, true, "a proxy denial must be distinguished from an origin 403");
    assert.equal(denied.ok, false);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("a host that blocks robots is unverifiable, not broken", async () => {
  // The first live run reported 11 failures; 9 were hosts that serve a
  // challenge to a datacenter IP and serve the page fine to a person. A check
  // that flags nine good links to catch one dead one gets muted, and then the
  // real 404 rides along with them.
  const { verdictFor } = await import("../scripts/check-links.mjs");

  for (const url of [
    "https://www.linkedin.com/in/jasoncolapietro",
    "https://x.com/johnnysuede",
    "https://www.crunchbase.com/person/jason-colapietro-d83e",
    "https://jasoncolapietro.substack.com",
    "https://pitchbook.com/profiles/company/937217-71",
    "https://www.npmjs.com/package/@suedeai/plugin-suede",
  ]) {
    assert.equal(verdictFor(403, url).severity, "warn", `${url} 403 must not read as broken`);
  }

  // Rate limiting and LinkedIn's 999 are never evidence about the link itself,
  // whatever the host.
  assert.equal(verdictFor(429, "https://example.com/a").severity, "warn");
  assert.equal(verdictFor(999, "https://example.com/a").severity, "warn");

  // A genuine removal still fails, on any host — this is the one real finding
  // the first live run surfaced, and it must not be softened along with them.
  assert.equal(verdictFor(404, "https://www.indiehackers.com/post/some-removed-post").severity, "fail");
  assert.equal(verdictFor(410, "https://www.linkedin.com/in/whoever").severity, "fail");
  assert.equal(verdictFor(500, "https://example.com/a").severity, "fail");

  // A 403 from a host with no such reputation is still a real failure.
  assert.equal(verdictFor(403, "https://suedeai.ai/founder").severity, "fail");

  // Subdomains count; lookalike suffixes do not.
  assert.equal(verdictFor(403, "https://www.instagram.com/suedeai").severity, "warn");
  assert.equal(verdictFor(403, "https://notinstagram.com/x").severity, "fail");
});
