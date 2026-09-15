// Link extraction for the profile surfaces.
//
// Every claim on these pages is carried by a link, so a link that rots, picks
// up a share tracker, or points at a heading that has been renamed degrades the
// evidence even though the prose still reads correctly. The extractor is pure
// and separated from the network so the cheap half of the audit — relative
// paths, in-page anchors, URL hygiene — can run on every pull request, while
// only the half that needs the public internet waits for the scheduled job.

// Fenced code blocks are documentation of a URL, not a live reference to one.
const stripFences = (text) => text.replace(/^```[\s\S]*?^```/gm, "");

const MARKDOWN_LINK = /\[(?<text>[^\]]*)\]\((?<url>[^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_ATTR = /<(?:a|img)\b[^>]*?\b(?:href|src)="(?<url>[^"]+)"/g;
const AUTOLINK = /<(?<url>(?:https?:\/\/|mailto:)[^>\s]+)>/g;

/**
 * Classify a raw link target.
 *
 * `anchor` and `relative` are resolvable inside the repository and cost
 * nothing to check; `external` needs the network; `mailto` is neither
 * fetchable nor checkable and is only held to formatting.
 */
export const classify = (url) => {
  if (url.startsWith("#")) return "anchor";
  if (url.startsWith("mailto:")) return "mailto";
  if (/^https?:\/\//.test(url)) return "external";
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return "other";
  return "relative";
};

/** Every link in one document, with the line it sits on for reporting. */
export const extractLinks = (text, file) => {
  const body = stripFences(text);
  const lines = body.split("\n");
  const found = [];

  for (const [index, line] of lines.entries()) {
    for (const pattern of [MARKDOWN_LINK, HTML_ATTR, AUTOLINK]) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        const url = match.groups.url;
        found.push({ file, line: index + 1, url, kind: classify(url) });
      }
    }
  }

  return found;
};

/**
 * GitHub's heading slug algorithm, which is what an in-page anchor like
 * `#apps` actually resolves against: lowercase, drop punctuation other than
 * hyphens, then map each remaining whitespace character to a hyphen.
 *
 * Runs of whitespace are deliberately not collapsed. Removing punctuation
 * leaves the space on either side of it behind, so "Apps & Tools" slugs to
 * "apps--tools" with two hyphens — collapsing here would generate an anchor
 * GitHub never serves and report a working link as broken.
 */
export const slugify = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s/g, "-");

/** Anchor targets a Markdown document offers, from its ATX headings. */
export const headingSlugs = (text) => {
  const slugs = new Set();
  const seen = new Map();

  for (const line of stripFences(text).split("\n")) {
    const match = /^#{1,6}\s+(.*)$/.exec(line);
    if (!match) continue;
    const base = slugify(match[1]);
    // GitHub disambiguates repeated headings with -1, -2, ... suffixes.
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }

  return slugs;
};
