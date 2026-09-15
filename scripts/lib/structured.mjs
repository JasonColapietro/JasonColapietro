// Structured-data extraction, for the agent-readability audit.
//
// This repository is an entity record: its job is to let a model or a crawler
// resolve "Jason Colapietro", "Johnny Suede", and "Suede Labs AI" to one
// identity with evidence attached. That only works if the live surfaces assert
// the same identity the documents here do. These helpers are pure so the rules
// are testable without reaching the network.

const JSONLD_BLOCK = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Every JSON-LD block in a page, parsed.
 *
 * Invalid blocks are returned rather than dropped: a block that does not parse
 * is the single most useful finding this audit can produce, because the page
 * looks annotated to a human reading the source and is invisible to a consumer.
 */
export const extractJsonLd = (html) => {
  const blocks = [];
  JSONLD_BLOCK.lastIndex = 0;

  for (const match of html.matchAll(JSONLD_BLOCK)) {
    const raw = match[1].trim();
    try {
      blocks.push({ ok: true, data: JSON.parse(raw) });
    } catch (error) {
      blocks.push({ ok: false, error: error.message, raw: raw.slice(0, 200) });
    }
  }

  return blocks;
};

/** Flatten @graph containers and arrays into a flat list of typed nodes. */
export const flattenNodes = (data) => {
  const out = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node["@graph"])) return node["@graph"].forEach(visit);
    out.push(node);
  };
  visit(data);
  return out;
};

const asArray = (value) => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);

/** Nodes of a given schema.org type, tolerating array-valued @type. */
export const nodesOfType = (nodes, type) =>
  nodes.filter((node) => asArray(node["@type"]).some((t) => String(t).toLowerCase() === type.toLowerCase()));

/** Every sameAs URL asserted anywhere in the page's structured data. */
export const sameAsUrls = (nodes) => {
  const urls = new Set();
  for (const node of nodes) {
    for (const value of asArray(node.sameAs)) {
      if (typeof value === "string") urls.add(value.trim().replace(/\/$/, ""));
    }
  }
  return urls;
};

/**
 * The URLs this repository documents, read out of the canonical documents so
 * they remain the single source of truth and the checker cannot drift from
 * them independently.
 *
 * Takes several documents because the identity is deliberately split across
 * them: the Meta accounts live in Instagram and Facebook.md, which records why
 * each exists and which look-alikes are not ours. Reading only Public Links.md
 * reported those accounts as undocumented when they were documented all along,
 * one file over — a checker bug that reads exactly like a content gap.
 */
export const canonicalIdentityUrls = (...markdownDocs) => {
  const urls = new Set();

  for (const doc of markdownDocs.flat()) {
    if (typeof doc !== "string") continue;

    // Stop at the machine-readable section. The endpoints below it — the IP
    // registry, the x402 manifest, the agent card — are evidence about the
    // entity, not claims to *be* the entity, and a surface listing one under
    // sameAs is making a modelling error this audit should still catch.
    // Documents without that heading are read whole.
    const identitySection = doc.split("## Machine-readable proof")[0];

    for (const match of identitySection.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)) {
      const url = match[1].replace(/\/$/, "");
      // Badge images are decoration, never identity claims.
      if (url.includes("img.shields.io")) continue;
      urls.add(url);
    }
  }

  return urls;
};

/**
 * Long numeric identifiers the documents mention as bare text rather than as
 * links.
 *
 * Some surfaces are documented on purpose without being linked. The Facebook
 * Page is the live case: it is reachable only by numeric ID, a guard in tests/
 * rejects that form in the link index until a vanity username exists, and the
 * Meta document records the ID and the reasoning. The `sameAs` sets still
 * assert the Page, so matching on the identifier lets the audit see it as
 * documented without publishing a URL the repository has decided to withhold.
 *
 * Ten digits is the floor so this cannot match a year, a version, or a count.
 */
export const documentedIdentifiers = (...markdownDocs) => {
  const ids = new Set();
  for (const doc of markdownDocs.flat()) {
    if (typeof doc !== "string") continue;
    for (const match of doc.matchAll(/\b\d{10,}\b/g)) ids.add(match[0]);
  }
  return ids;
};

/** Pull <link rel="canonical"> if the page declares one. */
export const canonicalLink = (html) =>
  html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
  html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ??
  null;
