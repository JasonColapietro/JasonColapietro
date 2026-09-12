# Instagram and Facebook

The Meta surfaces for Jason Colapietro and Suede Labs AI, what each one is for, and the
work that would make them findable. The four accounts in the table below are asserted in the
`sameAs` arrays already shipping on the owned surfaces; this page is the entry the profile
repository was missing. Everything named after that table is recorded for the opposite
reason: two accounts that exist but belong in no `sameAs`, and several that are not ours at
all.

The short version: Instagram and Facebook are a configuration job, not a channel. They can
hold page-one slots for navigational queries, give the entity write access to two Google
title tags, and corroborate the link between Jason Colapietro, Johnny Suede, and Suede Labs
AI. They cannot outrank an owned domain for the name, cannot rank for topical queries, and
cannot disambiguate "Johnny Suede" from the 1991 film.

## Canonical accounts

| Surface | Account | URL | Status |
|---|---|---|---|
| Suede Labs AI | Instagram `@suedeai` | [instagram.com/suedeai](https://www.instagram.com/suedeai) | Live. In the Organization `sameAs` of ~18 owned hosts. |
| Suede Sing | Instagram `@suedesingapp` | [instagram.com/suedesingapp](https://www.instagram.com/suedesingapp) | Live, verified August 27, 2026. The only Suede Sing account. |
| StoryBeam Kids | Instagram `@storybeampodcast` | [instagram.com/storybeampodcast](https://www.instagram.com/storybeampodcast) | Live. App and podcast, not Suede-branded. |
| Suede Labs AI | Facebook Page "Suede Labs AI" | Numeric ID `61584534847516` | Live, **no vanity username claimed**. Used only for commenting; no original Page posts with reach. |

Jason's personal Facebook profile and a dormant "Johnny Suede" Facebook profile also exist.
Neither is linked from an owned surface, neither is in any `sameAs`, and neither should
become a publishing surface. The personal profile's vanity string is `suedeai`, which
collides with the Instagram organization handle — a reason to keep the two clearly separate
rather than to unify them.

## Deliberately absent

- **No personal Instagram for Jason Colapietro or Johnny Suede.** The person entity routes
  to X, LinkedIn, YouTube, Substack, Amazon, and GitHub. Instagram carries the organization
  only. Owned audits annotate the Instagram link on johnnysuede.com and Substack as *the org
  account, not a personal one*.
- **No Suede Sing Facebook Page.** `/suedesingapp` does not resolve on Facebook, and a dead
  `sameAs` weakens consolidation rather than helping it.
- **No per-app accounts** for Studio, Agents, Social, DNA, Strumly, Scan, Muse, FretPulse,
  guitar.solutions, or guitarchords.info. All reuse the organization pair. Suede Sing is the
  sole product exception.

Three thin accounts split follow intent and read as abandoned. Two maintained accounts beat
five dormant ones.

## Accounts that are not ours

Do not claim, link, or list these. Several are name matches that surface in the same SERPs.

| Candidate | Verdict |
|---|---|
| `instagram.com/johnnysuede1` | Not ours. A third-party result for `"Johnny Suede" Suede Labs`. |
| `facebook.com/suedesing` | Documented in owned source as an unrelated page. |
| `instagram.com/suedesing` | Probed non-existent, August 27, 2026. |
| `facebook.com/johnnysuedeclothing` | Unrelated clothing brand. |
| Johnny Suede band and 1991 film pages | Unrelated. |
| `instagram.com/getsuede.ai` | Unrelated AI product. Argues against any `suede.ai`-style handle. |
| `instagram.com/fretpulse.io` | Unrelated. Suede's FretPulse is fretpulse.suedeai.ai. |

## What to fix, in order

1. **Claim a Facebook vanity username.** The Page is reachable only by numeric ID, which is
   the weakest ranking surface Meta offers and cannot be recorded in Wikidata at all —
   property P2013 carries a constraint excluding `*.php` paths. Usernames are 5–50
   characters, letters, numbers, and periods only, with a change cooldown that makes this
   effectively one-shot. `suedelabsai` first, `suedeai` as fallback. Resolve whether the
   entity is a Page or a new-style profile before claiming, because the username follows the
   entity.
2. **Confirm both Instagram accounts are Professional with search-engine indexing on.**
   Since July 10, 2025, public posts from professional accounts are indexable by Google and
   Bing — captions, alt text, Reels, carousels, back to January 1, 2020. It is default-on
   with an opt-out under Settings → Privacy, so verify rather than assume. Nothing else on
   this list matters if the toggle is off. Stories and Highlights are never indexed. Prefer
   Creator over Business: no search difference, and Business loses the trending audio
   library, which is disqualifying for music content.
3. **Write the name fields.** These are the highest-leverage text in the whole footprint,
   because Instagram's profile title template renders the display name verbatim into
   Google's title link. Instagram allows 30 characters and two changes per 14 days:
   `Suede Labs | AI Music Tools` (27) fits. Keep the Facebook Page name conservative at
   `Suede Labs AI` — Meta rejects keyword-stuffed and generic Page names, every past name
   stays public in Page Transparency, and keywords are free in the category and About fields
   instead.
4. **Fill the Facebook About section.** The 255-character bio becomes the Google meta
   description. The long description takes up to 50,000 characters and is indexed, as are
   mission, products, awards, and story.
5. **Make the bios agree with everything else.** For AI answers, Meta profiles mostly work by
   *contradiction suppression* — a bio that disagrees with the owned sites makes models
   hedge, so consistency removes a bad signal rather than adding a good one. Use one verbatim
   sentence, not paraphrases, across both bios and the owned sites: *Johnny Suede is the
   creative name of Jason Colapietro.* On Facebook, the sanctioned mechanism for the stage
   name is the Alternate name field, not a second profile.
6. **Close the `sameAs` loop.** The accounts are already in the Organization arrays on the
   owned hosts; each profile's link field should point back to the canonical owned URL. Meta
   back-links are `nofollow`, so their whole value is as reciprocal identity assertion —
   one-way claims are weak and hijackable in reverse.
7. **Record the identifiers on Wikidata, organization item first.** P2003 takes the Instagram
   username, handle only, no `@`; P12546 takes the numeric ID as a rename-proof qualifier;
   P2013 takes the Facebook username and is blocked until step 1. These belong on the
   organization item, not on Q140235755, since no personal accounts exist. Self-assigned
   identifiers do not count toward notability, and an item dominated by them invites
   deletion — reference each to the owned site rather than to the profile itself.
8. **Audit Open Graph tags on the owned domains.** This is one fix that improves link
   rendering on Facebook, Messenger, Instagram DMs, Slack, Discord, iMessage, and LinkedIn
   permanently. `facebookexternalhit` does not execute JavaScript and parses only the first
   ~60 KB of HTML, so tags must be server-rendered and early. Images should be 1200×630, no
   smaller than 600×315, under 8 MB; WebP is fine, AVIF is not safe. Facebook caches a scrape
   for roughly 30 days and keys on the image path, so a changed picture at an unchanged path
   keeps serving the old one.

The audit in step 8 could not be run from this session — every owned domain, and both Meta
domains, are blocked by the network egress proxy. To run it:

```sh
for u in jasoncolapietro.com johnnysuede.com suedeai.ai suedeai.org sing.suedeai.ai \
         strumly.suedeai.ai guitar.solutions ip.suedeai.ai agents.suedeai.ai; do
  curl -sSL -A 'facebookexternalhit/1.1' "https://$u" \
    | grep -Eio '<meta[^>]+(og:|twitter:|fb:)[^>]*>|<link[^>]+canonical[^>]*>'
done
```

## What does not work

Spending effort here is the most common way an Instagram and Facebook program produces
nothing.

- **Hashtags for reach.** Hashtag-following was removed in December 2024 and Instagram has
  said hashtags are not an important reach factor. They survive only as a topic signal and a
  search index entry: 3–5 in the caption, not 30, and first-comment placement is obsolete.
- **Stories and Highlights as SEO.** Never indexed, on either platform.
- **Facebook link posts.** Roughly 70–80% reach suppression, wrapped through `l.facebook.com`
  with `nofollow`, so no link equity and not even clean attribution. Budget two a month.
- **Expecting ChatGPT, Claude, or Perplexity to read these profiles.** Meta runs an allowlist
  admitting Googlebot-class crawlers and excluding AI crawlers by omission, licenses content
  in but not out, and the scraper mirrors have collapsed. Google's index is the only live
  route, which does at least make indexed Instagram content eligible for AI Overviews.
- **Buying reach.** Engagement pods, purchased followers, follow/unfollow churn, auto-DMs,
  any tool wanting an account password, and scraping Meta. These are also precisely the
  signals Suede Scan and Suede Lens exist to detect, which makes them costlier here than for
  most accounts.

One tactic is genuinely disputed. A public Facebook Group is reportedly the second-largest
source in Google's Discussions and Forums results after Reddit, which would make it the best
new Facebook asset available; the counter-argument is that Groups are a cadence commitment
that this footprint cannot currently sustain, given that the Page has no original posts at
all. Treat it as an experiment with a kill date, not a commitment, and only after steps 1–4.

## Content, when there is cadence

Captions are the index. Instagram matches search text semantically, so natural sentences beat
repetition, and the first ~125 characters are what survives truncation for human readers.
Alt text is a separate indexed field on every carousel slide, which makes a ten-slide carousel
ten indexed fields. Reels pick up on-screen text and spoken audio. Cross-posting a video to
Facebook is fine, but write the caption separately — the caption is the indexable unit, and
identical text wastes the second surface.

One risk worth designing around: since August 31, 2026, Instagram labels accounts it detects
as AI personas and makes unlabeled ones ineligible for recommendations. Johnny Suede is a real
person's stage name and the label is aimed at profiles pretending to be human, but an account
that is entirely AI-generated imagery behind a stylised name matches the detector's pattern.
Disclose AI use per post, publish unaltered footage of Jason regularly, keep C2PA provenance
intact, and never describe Johnny Suede as an AI or virtual artist.

## Open verification items

These could not be checked from this session, because the network egress proxy blocked every
owned domain, both Meta domains, and Wikidata. None of them is load-bearing for steps 1–8,
but each should be confirmed before any of this is published as advice.

- The `robots.txt` of instagram.com and facebook.com, quoted live rather than through
  secondary reporting.
- Whether the Facebook entity is a Page or a new-style profile, and whether `suedelabsai` is
  available.
- Which Meta identifiers are already set on the Wikidata items.
- Hashtag volumes, which no reachable counter would report.
- Two claims that surfaced in research and are not corroborated: a Facebook-native AI answer
  mode launched mid-2026, and an Instagram originality score doing frame-level fingerprinting.
  Both are plausible and neither should be relied on until verified.

Last reviewed: September 12, 2026.
