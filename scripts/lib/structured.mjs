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
 * The identity URLs this repository considers canonical, read out of
 * Public Links.md so the documents remain the single source of truth and the
 * checker cannot drift from them independently.
 */
export const canonicalIdentityUrls = (publicLinksMarkdown) => {
  const urls = new Set();
  // Only the two identity tables; the machine-readable and publications
  // sections list endpoints and hosts, which are not identity assertions.
  const section = publicLinksMarkdown.split("## Machine-readable proof")[0];

  for (const match of section.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)) {
    const url = match[1].replace(/\/$/, "");
    // Badge images and intra-repo anchors are not identity claims.
    if (url.includes("img.shields.io")) continue;
    urls.add(url);
  }

  return urls;
};

/** Pull <link rel="canonical"> if the page declares one. */
export const canonicalLink = (html) =>
  html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
  html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ??
  null;
