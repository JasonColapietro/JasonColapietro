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
// form from being published as a shortcut, in any of its spellings: the
// profile.php query, the /people/Name/id path, and the bare id, which looks
// like a username until you notice it has no letter in it. A real Facebook
// username is 5 to 50 characters and cannot be all digits.
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
      const username = "(?=[a-z0-9.]*[a-z])[a-z0-9.]{5,50}";
      const pattern = /^https:\/\//.test(raw)
        ? new RegExp(`^https://www\\.facebook\\.com/(${username})$`)
        : new RegExp(`^facebook\\.com/(${username})$`);

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

// Counts on the profile are asserted in several places at once — a badge, a
// Highlights bullet, a section lead, and sometimes the prose of another section.
// Reconciling them after they drift apart is the most common commit in this
// repo's history, and at least one count (upstream merges) has shipped wrong.
// These guards pin each count to something countable in the file itself.
test("profile counts agree with the badges and with what the file lists", async () => {
  const readme = await read("README.md");

  const badge = (pattern) => {
    const match = readme.match(pattern);
    assert.ok(match, `badge not found: ${pattern}`);
    return Number(match[1]);
  };
  const occurrences = (pattern) => (readme.match(pattern) ?? []).length;

  // Several of these counts are also spelled out in prose, where a badge and a
  // table row can agree with each other while the sentence beside them goes
  // stale. Comparing digits alone would miss that, so compare the word forms.
  //
  // This returns a regex fragment rather than a fixed string, so that a count
  // written "one hundred and twenty-seven" matches one written "one hundred
  // twenty-seven": the assertion is about the number, not about house style.
  // Anything past the supported range throws by name instead of interpolating
  // "undefined" into the pattern, which would fail a correctly updated README.
  const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const inWords = (n) => {
    if (!Number.isInteger(n) || n < 0 || n > 999) {
      throw new RangeError(`inWords covers 0 to 999 and was given ${n}; extend it before the counts reach that far`);
    }
    if (n < 20) return ONES[n];
    if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? `[- ]${ONES[n % 10]}` : ""}`;
    const rest = n % 100;
    return `${ONES[Math.floor(n / 100)]} hundred${rest ? `(?: and)?[- ]${inWords(rest)}` : ""}`;
  };

  // Store counts must match the rows the Apps table actually lists, and the two
  // places the same totals are written out in words.
  const ios = badge(/iOS_apps-(\d+)-/);
  const android = badge(/Android_apps-(\d+)-/);
  const chrome = occurrences(/\| Chrome \|/g);
  assert.equal(ios, occurrences(/\| iOS \|/g), "iOS badge vs Apps table rows");
  assert.equal(android, occurrences(/\| Android \|/g), "Android badge vs Apps table rows");
  assert.match(readme, new RegExp(`${inWords(ios)} iOS apps and ${inWords(android)} Android apps`, "i"),
    "Highlights prose vs the iOS and Android badges");
  assert.match(
    readme,
    new RegExp(`${inWords(ios)} on the App Store, ${inWords(android)} on Google Play, ${inWords(chrome)} on the Chrome Web Store`, "i"),
    "Apps section lead vs the badges and the Chrome row",
  );

  // Books badge counts Amazon titles only; the independents are listed separately.
  assert.equal(badge(/badge\/books-(\d+)_on_Amazon/), occurrences(/amazon\.com\/dp/g), "books badge vs Amazon links");

  // The upstream record is one number in three renderings, plus a split that must sum.
  const prs = badge(/upstream_merges-(\d+)_PRs/);
  const repos = badge(/upstream_merges-\d+_PRs_%2F_(\d+)_repos/);
  assert.match(readme, new RegExp(`${prs} pull requests merged into ${repos} open-source projects`));
  assert.match(readme, new RegExp(`merged across ${repos} repositories`));
  const split = readme.match(/(\d+) are fixes, features, tests, and docs; the other (\d+) are accepted listings/);
  assert.ok(split, "numeric substantive/listing split not found");
  const [substantive, listings] = [Number(split[1]), Number(split[2])];
  assert.equal(substantive + listings, prs, "substantive + listings must equal the total");
  // The split is written twice: digits in Highlights, words in Open source. A
  // reclassification that keeps the sum (27/17 to 28/16) would otherwise pass.
  assert.match(readme, new RegExp(`${inWords(substantive)} of the ${prs} are substantive`, "i"),
    "spelled-out substantive count vs the numeric split");
  assert.match(readme, new RegExp(`the other ${inWords(listings)} are accepted listings`, "i"),
    "spelled-out listing count vs the numeric split");

  // The skills count appears in the badge and three separate prose claims.
  const skills = badge(/open--source_skills-(\d+)-/);
  assert.equal(occurrences(new RegExp(`${skills} (open-source )?agent skills`, "g")), 3, "skills count occurrences");

  // The star count is rendered live by a shields.io badge, so it must not also
  // be hardcoded in prose, where it silently goes stale.
  assert.doesNotMatch(readme, /\d+ stars/, "star counts belong to the live badge, not to prose");
});

// The patent line is the weakest-evidenced claim on the page, and the only one
// that structurally cannot carry a third-party link: the USPTO does not publish
// provisional applications. That makes the wording load-bearing. A 63/-series
// serial is a provisional application, not a granted patent, and two earlier
// commits propagated "Patent 63/947,120" into the bio and the Programs section
// before it was corrected — so this guard keeps that phrasing from returning
// and keeps the two places that state the count from drifting apart.
test("patent claims are scoped to provisional applications and agree on the count", async () => {
  const readme = await read("README.md");

  assert.doesNotMatch(
    readme,
    /\bPatent(?:s)? \d{2}\//,
    'a 63/-series serial is a provisional application; write "provisional patent application", not "Patent"',
  );

  const programs = readme.match(/\*\*(\w+) provisional patent applications?\*\* on file with the USPTO[^\n]*/i);
  assert.ok(programs, "the Programs section must state the provisional application count");

  const bio = readme.match(/· (\w+) provisional patent applications?\*\*/i);
  assert.ok(bio, "the bio line must state the provisional application count");

  assert.equal(
    bio[1].toLowerCase(),
    programs[1].toLowerCase(),
    "the bio line and the Programs section must give the same provisional count",
  );

  // The serials are enumerated, so the stated count has something countable to
  // agree with. A count asserted without the numbers behind it is the weaker
  // claim, and the one that drifts.
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const stated = WORDS.indexOf(programs[1].toLowerCase());
  assert.notEqual(stated, -1, `unrecognised provisional count word: ${programs[1]}`);

  // Counted within the Programs entry itself, not across the whole file: a
  // serial mentioned in the changelog but missing from this list would
  // otherwise satisfy the count while the enumeration stayed incomplete.
  const serials = new Set(programs[0].match(/\b63\/\d{3},\d{3}\b/g) ?? []);
  assert.equal(
    serials.size,
    stated,
    `the Programs entry states ${programs[1]} provisional applications but enumerates ${serials.size} serial numbers`,
  );
});

// The vocal studio carries two names, and that is deliberate rather than drift:
// the App Store rename to "Suede Sing" was submitted on 2026-07-10 and
// 2026-07-14, rejected both times, and every submission since 2026-08-11 has
// gone in as "Suede Voice". So mobile is Suede Voice and web plus Chrome is
// Suede Sing. Both names are live, which is exactly the condition under which a
// surface quietly acquires the wrong one.
test("the vocal studio is Suede Voice on mobile and Suede Sing on web and Chrome", async () => {
  const readme = await read("README.md");

  // Apps table rows only — the same store IDs also appear in Highlights prose
  // and in the changelog, and matching those would prove nothing about the table.
  const row = (needle) => {
    const line = readme.split("\n").find((l) => l.startsWith("| [") && l.includes(needle));
    assert.ok(line, `no Apps table row found containing ${needle}`);
    return line;
  };

  // Store listings, identified by their store IDs rather than by their titles,
  // so a renamed row cannot satisfy the guard by matching on the new name.
  assert.match(row("id6767763231"), /\|\s*\[Suede Voice/, "the iOS row must be listed as Suede Voice");
  assert.match(row("ai.suedeai.suedevoice"), /\|\s*\[Suede Voice/, "the Android row must be listed as Suede Voice");
  assert.match(
    row("dbimnmcokgmibdenmonoafhmdbjhpicd"),
    /\|\s*\[Suede Sing/,
    "the Chrome row must be listed as Suede Sing",
  );

  // And the Selected work row must keep stating the split, since that is the one
  // place a reader learns the two names are one product. Targeted at that row
  // rather than the file: the sentence surviving in a changelog entry while the
  // row lost it would satisfy a document-wide match and prove nothing.
  assert.match(
    row("sing.suedeai.ai"),
    /Also on iOS and Android as Suede Voice, and on Chrome as Suede Sing/,
    "the Suede Sing row in Selected public work must state which name each platform uses",
  );
});
