import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("profile documents keep Jason canonical and publish the creative alias", async () => {
  const [readme, identity, links] = await Promise.all([
    read("README.md"),
    read("docs/Jason Colapietro.md"),
    read("docs/Public Links.md"),
  ]);

  assert.match(readme, /^# Jason Colapietro/m);
  assert.match(readme, /Johnny Suede/);
  assert.match(readme, /https:\/\/jasoncolapietro\.com/);
  assert.match(readme, /https:\/\/johnnysuede\.com/);

  assert.match(identity, /\| Canonical name \| Jason Colapietro \|/);
  assert.match(identity, /\| Creative alias \| Johnny Suede \|/);
  assert.match(links, /https:\/\/jasoncolapietro\.com/);
  assert.match(links, /https:\/\/johnnysuede\.com/);
});

// "Jay Colapietro" is not an alias Jason uses. It was removed from the entity
// surfaces across the estate on 2026-08-07; this guard keeps it from returning.
test("profile documents do not reintroduce the Jay Colapietro alias", async () => {
  const files = ["README.md", "docs/Jason Colapietro.md", "docs/Public Links.md"];
  const contents = await Promise.all(files.map(read));

  for (const [index, text] of contents.entries()) {
    assert.doesNotMatch(text, /Jay Colapietro/, `${files[index]} reintroduces the Jay Colapietro alias`);
  }
});

// Instagram and Facebook joined the entity surfaces on 2026-09-12. The accounts
// belong to Suede Labs AI, not to Jason personally, so they live in the link
// index and the profile badge row rather than the personal identity table. A
// handle that drifts between those two surfaces, or picks up a share tracker
// like ?igsh=, splits the entity record instead of confirming it.
const LINK_SURFACES = ["README.md", "docs/Public Links.md"];

test("the Instagram handle is canonical and identical on every surface that carries it", async (t) => {
  const contents = await Promise.all(LINK_SURFACES.map(read));
  const mentions = contents.map(
    (text) => text.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)*(?:instagram\.com|instagr\.am)[^\s)\]"'<>|`]*/gi) ?? [],
  );

  if (mentions.every((found) => found.length === 0)) {
    t.skip("no Instagram handle published yet; this guard activates with the first one");
    return;
  }

  const handles = new Set();

  for (const [index, found] of mentions.entries()) {
    for (const raw of found) {
      // A mention with a scheme is a link target and carries the www host Meta
      // redirects to; a bare one is display text, written the way the LinkedIn
      // and X rows are written.
      const pattern = /^https:\/\//.test(raw)
        ? /^https:\/\/www\.instagram\.com\/([a-z0-9._]+)$/
        : /^instagram\.com\/([a-z0-9._]+)$/;
      const match = pattern.exec(raw);

      assert.ok(
        match,
        `${LINK_SURFACES[index]} writes Instagram as ${raw}; use https://www.instagram.com/<handle> with no trailing slash and no query string`,
      );
      handles.add(match[1]);
    }
  }

  assert.equal(
    handles.size,
    1,
    `the entity surfaces name more than one Instagram handle: ${[...handles].sort().join(", ")}`,
  );

  const canonical = `https://www.instagram.com/${[...handles][0]}`;

  for (const [index, text] of contents.entries()) {
    assert.ok(
      text.includes(canonical),
      `${LINK_SURFACES[index]} is missing ${canonical}; the Instagram link has to appear on both link surfaces`,
    );
  }
});

// The Suede Labs AI Page is reachable only by numeric ID because no vanity
// username has been claimed. A numeric URL is the weakest surface Meta offers
// and Wikidata's P2013 constraint excludes it outright, so the Page stays out
// of the link index until the username exists. This guard keeps the numeric
// form from being published as a shortcut.
test("a published Facebook link uses a claimed username, not a numeric id", async (t) => {
  const contents = await Promise.all(LINK_SURFACES.map(read));
  const mentions = contents.map(
    (text) => text.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.me)[^\s)\]"'<>|`]*/gi) ?? [],
  );

  if (mentions.every((found) => found.length === 0)) {
    t.skip("no Facebook vanity username claimed yet; this guard activates with the first one");
    return;
  }

  for (const [index, found] of mentions.entries()) {
    for (const raw of found) {
      const pattern = /^https:\/\//.test(raw)
        ? /^https:\/\/www\.facebook\.com\/([a-z0-9.]+)$/
        : /^facebook\.com\/([a-z0-9.]+)$/;

      assert.match(
        raw,
        pattern,
        `${LINK_SURFACES[index]} writes Facebook as ${raw}; publish the Page only once it has a username, as https://www.facebook.com/<username>`,
      );
    }
  }
});

// Several same-name accounts sit in the same search results as ours: a stray
// "johnnysuede1", a clothing brand, an unrelated page that took the suedesing
// name. docs/Instagram and Facebook.md names them so they stay identifiable,
// but naming one is not linking to one, and no surface may link to any.
test("no surface links to a Meta account that is not ours", async (t) => {
  const files = [
    "README.md",
    "COMBINED.md",
    "docs/Public Links.md",
    "docs/Jason Colapietro.md",
    "docs/Suede Labs AI.md",
    "docs/Instagram and Facebook.md",
  ];
  const contents = await Promise.all(files.map(read));
  const notOurs = [
    "instagram.com/johnnysuede1",
    "instagram.com/getsuede.ai",
    "instagram.com/fretpulse.io",
    "facebook.com/johnnysuedeclothing",
    "facebook.com/suedesing",
  ];

  for (const [index, text] of contents.entries()) {
    for (const account of notOurs) {
      assert.ok(
        !text.includes(`https://www.${account}`) && !text.includes(`https://${account}`),
        `${files[index]} links to ${account}, which is not ours`,
      );
    }
  }
});
