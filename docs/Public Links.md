# Canonical public links and feeds

The canonical link index for Jason Colapietro, who publishes as Johnny Suede, and for Suede Labs AI: official sites, profiles, third-party records, and machine-readable endpoints. Use this page to resolve which URL is authoritative for an identity or a surface. For the current product inventory, paths, and prices, use the live directories at [hub.suedeai.ai](https://hub.suedeai.ai) and [map.suedeai.ai](https://map.suedeai.ai).

This index is reconciled against the `sameAs` sets the owned surfaces actually publish, checked by `npm run check:entity`. A surface asserting an identity this page does not carry is treated as a defect in one of the two, not as a detail: the point of the page is that there is exactly one answer to "which URL is authoritative", and an assertion made only in JSON-LD is an answer nobody can look up.

## Jason Colapietro

| Type | URL |
|---|---|
| Personal site | [jasoncolapietro.com](https://jasoncolapietro.com) |
| Creative identity site (Johnny Suede) | [johnnysuede.com](https://johnnysuede.com) |
| Founder record | [suedeai.ai/founder](https://suedeai.ai/founder) |
| Supporting founder profile | [suedeai.org/jason-colapietro](https://suedeai.org/jason-colapietro/) |
| Founder profile on Agent Studio | [agents.suedeai.ai/founder](https://agents.suedeai.ai/founder) |
| GitHub | [github.com/JasonColapietro](https://github.com/JasonColapietro) |
| Writing | [jasoncolapietro.substack.com](https://jasoncolapietro.substack.com) |
| LinkedIn | [linkedin.com/in/jasoncolapietro](https://www.linkedin.com/in/jasoncolapietro) |
| X (Johnny Suede) | [@johnnysuede](https://x.com/johnnysuede) |
| YouTube | [@johnnysuede](https://www.youtube.com/@johnnysuede) |
| Apple developer page | [apps.apple.com/us/developer/jason-colapietro](https://apps.apple.com/us/developer/jason-colapietro/id1895958699) |
| Amazon author store | [amazon.com/stores/author/B0H3DPP75K](https://www.amazon.com/stores/author/B0H3DPP75K) |
| Holding entity | [jcinvestmentgroup.ventures](https://jcinvestmentgroup.ventures) |
| Email | [jason@suedeai.ai](mailto:jason@suedeai.ai) |

The person entity routes to X, LinkedIn, YouTube, Substack, Amazon, and GitHub. It carries no Instagram account by choice; see [Instagram and Facebook](./Instagram%20and%20Facebook.md).

**Unresolved:** two different Amazon author stores are asserted for the same person. The personal sites publish [B0H3DPP75K](https://www.amazon.com/stores/author/B0H3DPP75K), above; suedeai.ai publishes [B0H3F13X6H](https://www.amazon.com/stores/author/B0H3F13X6H). One of them should win and the other should be dropped from its `sameAs`, because two author stores for one author is the split this index exists to prevent.

## Suede Labs AI

### Owned surfaces

| Surface | URL | Purpose |
|---|---|---|
| Product | [suedeai.ai](https://suedeai.ai) | Creator ownership platform and primary public front door |
| Company and thesis | [suedeai.org](https://suedeai.org) | Ownership, provenance, books, and company material |
| Application | [app.suedeai.ai](https://app.suedeai.ai) | Application root |
| Creator application | [app.suedeai.ai/create](https://app.suedeai.ai/create) | Creator workflow |
| Developer portal | [app.suedeai.ai/developers](https://app.suedeai.ai/developers) | Developer workflow and API entry point |
| Suede Agent Studio | [agents.suedeai.ai](https://agents.suedeai.ai) | Visual agent building, publishing, and pay-per-call workflows |
| Product hub | [hub.suedeai.ai](https://hub.suedeai.ai) | Live ecosystem directory |
| Ecosystem map | [map.suedeai.ai](https://map.suedeai.ai) | Products, protocols, apps, and publications |
| Vocal studio | [sing.suedeai.ai](https://sing.suedeai.ai) | Suede Sing in the browser; ships as Suede Voice on iOS and Android |
| Open-source skills | [skills.suedeai.ai](https://skills.suedeai.ai) | Suede Creator Skills for Claude Code and Codex |
| Suede Social | [suede.social](https://suede.social) | Social surface |
| GuitarChords | [guitarchords.info](https://guitarchords.info) | Guitar chord reference |
| GuitarHub | [guitarhub.org](https://guitarhub.org) | Guitar tools and guides |
| GitHub organization | [github.com/Suede-AI](https://github.com/Suede-AI) | Public code and documentation |

### Accounts

| Surface | URL | Notes |
|---|---|---|
| X | [@AISUEDE](https://x.com/AISUEDE) | Company account. Distinct from [@johnnysuede](https://x.com/johnnysuede), which is Jason's. |
| YouTube | [@aisuede](https://www.youtube.com/@aisuede) | Company channel |
| Telegram | [t.me/SUEDEAI](https://t.me/SUEDEAI) | Community |
| Instagram | [instagram.com/suedeai](https://www.instagram.com/suedeai) | Company account; asserted in the Organization `sameAs` of the owned surfaces |
| LinkedIn | [linkedin.com/company/suede-labs](https://www.linkedin.com/company/suede-labs) | Company page |
| Linktree | [linktr.ee/suedelabsai](https://linktr.ee/suedelabsai) | Link aggregator |

The Facebook Page is deliberately absent from this table. It is reachable only by numeric ID, and publishing that form is blocked by a guard in `tests/` until a vanity username is claimed; the Page and the reasoning are recorded in [Instagram and Facebook](./Instagram%20and%20Facebook.md). Product-level Instagram accounts live in that file too, so this index names one Instagram handle only.

## Third-party records

Records held by others. They are evidence rather than surfaces: none of them is editable as a publishing channel, and each corroborates the entity from outside it.

| Record | Entity | URL |
|---|---|---|
| Wikidata | Jason Colapietro | [Q140235755](https://www.wikidata.org/wiki/Q140235755) |
| Wikidata | Suede Labs AI | [Q141169484](https://www.wikidata.org/wiki/Q141169484) |
| Crunchbase | Jason Colapietro | [person/jason-colapietro-d83e](https://www.crunchbase.com/person/jason-colapietro-d83e) |
| Crunchbase | Suede Labs AI | [organization/suede-labs-ai](https://www.crunchbase.com/organization/suede-labs-ai) |
| PitchBook | Suede Labs AI | [profiles/company/937217-71](https://pitchbook.com/profiles/company/937217-71) |
| F6S | Suede Labs AI | [f6s.com/suede-ai](https://www.f6s.com/suede-ai) |
| Virtuals ACP | Suede Labs AI | [app.virtuals.io agent record](https://app.virtuals.io/acp/agent/019e3991-374d-75f3-a6b8-17ff309b4cd2) |

The two Wikidata items are deliberately separate: Q140235755 is the person, Q141169484 the organization. Organization identifiers belong on the organization item, and a reviewer will strip them from a person item as a modelling error.

## Alias domains

These resolve to the canonical personal sites and are asserted in the `sameAs` sets of [jasoncolapietro.com](https://jasoncolapietro.com) and [johnnysuede.com](https://johnnysuede.com). They are recorded here so the index is complete and so none of them is mistaken for a separate surface. **None of them is canonical**, and nothing should link to them in preference to the two sites above.

[jasoncolapietro.vip](https://jasoncolapietro.vip) · [colapietroai.com](https://colapietroai.com) · [colapietrolabs.com](https://colapietrolabs.com) · [jasonsuedelabs.com](https://jasonsuedelabs.com) · [johnnysuedelabs.com](https://johnnysuedelabs.com) · [jasonsuedeai.com](https://jasonsuedeai.com) · [johnnysuedeai.com](https://johnnysuedeai.com) · [suedemusicai.com](https://suedemusicai.com) · [johnnysuedemusic.com](https://johnnysuedemusic.com) · [jasonsuede.com](https://jasonsuede.com) · [suedeart.com](https://suedeart.com) · [jasonsuedeart.com](https://jasonsuedeart.com) · [johnnysuedeart.com](https://johnnysuedeart.com) · [colapietro.stream](https://colapietro.stream)

Worth a decision rather than a default: fourteen alias domains in a `sameAs` set is a wide net, and `sameAs` is a disambiguation signal. Asserting many near-identical domains spreads the signal it is meant to concentrate, and none of these carries independent content. Keeping the redirects costs nothing; keeping them in `sameAs` is the part to reconsider.

## Works

Book and reading-edition URLs asserted in the `sameAs` set of [suedeai.ai/founder](https://suedeai.ai/founder). The full annotated list, with titles, is in the [Books section of the profile](../README.md#books).

| Edition | URL |
|---|---|
| Amazon | [B0GD5FX6N6](https://www.amazon.com/dp/B0GD5FX6N6) · [B0GMB2VLXQ](https://www.amazon.com/dp/B0GMB2VLXQ) · [B0GRG8LGQQ](https://www.amazon.com/dp/B0GRG8LGQQ) · [B0HHTMJWB4](https://www.amazon.com/dp/B0HHTMJWB4) · [B0HHTF3LG1](https://www.amazon.com/dp/B0HHTF3LG1) |
| The Screenshot, reading edition | [seo.suedeai.ai/book](https://seo.suedeai.ai/book) |
| The Guitar Without a Number, catalog | [strumly.suedeai.ai/book/catalog](https://strumly.suedeai.ai/book/catalog) |
| The Signal Chain | [guitar.solutions](https://guitar.solutions) |

## Machine-readable proof

| Reference | URL |
|---|---|
| Public IP registry | [ip.suedeai.ai](https://ip.suedeai.ai) |
| x402 manifest | [app.suedeai.ai/.well-known/x402.json](https://app.suedeai.ai/.well-known/x402.json) |
| A2A agent card | [app.suedeai.ai/.well-known/agent-card.json](https://app.suedeai.ai/.well-known/agent-card.json) |

The live x402 manifest advertises paid music, video, and image resources. The manifest is the source of truth for advertised paths, prices, and methods; a manifest entry documents what is advertised, not that a call will succeed. Runtime behaviour is checked separately by `npm run check:x402`, which calls each advertised resource unpaid, requires a 402, and compares the live terms against the manifest.

## Independent publications

Hosts only; the individual paths change as editions ship.

| Title | Host |
|---|---|
| The Signal Chain | [guitar.solutions](https://guitar.solutions) |
| The Screenshot | [seo.suedeai.ai](https://seo.suedeai.ai) |
| The Guitar Without a Number | [strumly.suedeai.ai](https://strumly.suedeai.ai) |

## Selected repositories

| Repository | Focus |
|---|---|
| [JasonColapietro/agentix](https://github.com/JasonColapietro/agentix) | Public agent activity and earnings tracker |
| [JasonColapietro/suede-creator-skills](https://github.com/JasonColapietro/suede-creator-skills) | Open-source agent skills and workflows |
| [JasonColapietro/the-signal-chain](https://github.com/JasonColapietro/the-signal-chain) | Guitar history and signal-chain research |
| [JasonColapietro/anti-slop-templates](https://github.com/JasonColapietro/anti-slop-templates) | Open-source editorial and creator-ownership design systems |

Meta surfaces, including the accounts that are not ours, are documented in [Instagram and Facebook.md](./Instagram%20and%20Facebook.md).

## Related references

- [Profile, apps, books, press, and changelog](../README.md)
- [Jason Colapietro: public identity, roles, and evidence](./Jason%20Colapietro.md)
- [Suede Labs AI platform reference](./Suede%20Labs%20AI.md)
- [Canonical ecosystem directories](./Suede%20Universe%20Websites%20and%20Apps.md)
- [Instagram and Facebook surfaces](./Instagram%20and%20Facebook.md)

Content last updated: September 15, 2026. Every external link on this page was resolved by the scheduled link audit on September 15, 2026, with no failures; eleven hosts that challenge automated clients — among them LinkedIn, Instagram, X, Substack, Crunchbase, and PitchBook — cannot be checked from CI and were not confirmed by it. Public endpoints and product status can change; the live destination is authoritative.
