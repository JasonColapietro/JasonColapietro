# Jason Colapietro

**Founder and CEO of [Suede Labs AI](https://suedeai.ai) · Founder and Managing Member of JC Investment Group · published author · Patent 63/947,120**

Jason Colapietro builds systems that help creators record authorship, define rights, license work, and route revenue as media moves between people, platforms, and AI agents. At Suede Labs AI, his work spans programmable IP, provenance, registry-backed media, royalty routing, and agentic commerce over x402 and ERC-8004, with music and likeness as early use cases.

Jason publishes as **Johnny Suede**.

[Personal site](https://jasoncolapietro.com) · [Johnny Suede](https://johnnysuede.com) · [Suede Labs AI](https://suedeai.ai) · [Founder profile](https://suedeai.ai/founder) · [Writing](https://jasoncolapietro.substack.com) · [LinkedIn](https://www.linkedin.com/in/jasoncolapietro) · [X](https://x.com/johnnysuede) · [Wikidata](https://www.wikidata.org/wiki/Q140235755) · [Crunchbase](https://www.crunchbase.com/person/jason-colapietro-d83e)

## What I am building

- **Creator ownership:** creation evidence, provenance, rights metadata, licensing, and royalty routing.
- **Registry-backed media and likeness:** dated records and machine-readable consent terms for creative work, voice, face, name, and persona.
- **Agent commerce:** public agent metadata and x402 payments for machine-readable, pay-per-call workflows.
- **Music-first creator tools:** creation, distribution, guitar, and catalog experiences connected to an ownership layer.

## Selected public work

About 30 websites and 8 iOS apps. Full index at [hub.suedeai.ai](https://hub.suedeai.ai); the operating map, entity by entity, is at [map.suedeai.ai](https://map.suedeai.ai).

| Project | What it does |
|---|---|
| [Suede Labs AI](https://suedeai.ai) | The product front door. Creator ownership infrastructure for registering work and likeness, documenting provenance, licensing rights, and routing revenue. |
| [Suede Studio](https://studio.suedeai.ai) · [Suede Distro](https://distro.suedeai.ai) | Make music with AI and keep the master; release finished work to 100+ streaming services. |
| [Suede IP Registry](https://ip.suedeai.ai) | Public registry for creation evidence: wallet-signed claims, file fingerprints, and dated records on Base and Avalanche. |
| [Suede Agent Studio](https://agents.suedeai.ai) · [Agentix](https://agentix.suedeai.ai) | Build agents visually and ship them as paid per-call services over x402; track what they earn. |
| [Suede Scan](https://scan.suedeai.ai) | Shows what AI search engines say about a business, with screenshots, then repairs the site so machines can read it. |
| [Strumly](https://strumly.suedeai.ai) · [Suede Muse](https://muse.suedeai.ai) · [FretPulse](https://fretpulse.suedeai.ai) | Musician tools — a 24/7 guitar coach, a creative training companion, and a guitar-care app. |
| [Suede Social](https://social.suedeai.ai) · [Suede DNA](https://dna.suedeai.ai) | Creator community and gear magazine, plus an archive of 400+ guitarists' rigs and signal chains. |
| [Suede Creator Skills](https://github.com/JasonColapietro/suede-creator-skills) | 73 open-source agent skills for Claude Code and Codex, covering rights, provenance, releases, evaluation, design, engineering, and go-to-market work. |

## Books

[Suede Labs: The Human Authenticity Layer](https://www.amazon.com/dp/B0GD5FX6N6) · [Proof as Infrastructure](https://www.amazon.com/dp/B0GMB2VLXQ) · [Stake Your Claim](https://www.amazon.com/dp/B0GRG8LGQQ) · [The Signal Chain](https://guitar.solutions)

## Press

[TechBullion](https://techbullion.com/jason-colapietros-suede-labs-ai-launches-ios-apps/), May 2026 — Suede Labs AI launches iOS apps for musicians.

## Verify the work

- [Public IP registry](https://ip.suedeai.ai) — wallet-signed creator claims, file fingerprints, contributor records, and public timestamps; evidence, not legal title.
- [x402 manifest](https://app.suedeai.ai/.well-known/x402.json) — currently advertised paid API resources in a machine-readable catalog.
- [A2A agent card](https://app.suedeai.ai/.well-known/agent-card.json) — public agent identity, capabilities, and discovery metadata.

## Open source

Most of it is [Suede Creator Skills](https://skills.suedeai.ai) — agent skills for Claude Code and Codex, installable as a plugin marketplace. The [Suede Market Maker](https://github.com/Suede-AI/suede-market-maker) is out there too: a self-hosted Solana market maker dashboard, free, courtesy of Suede Labs AI.

Beyond my own repos, I send fixes upstream when something bites me mid-build. Thirty-two pull requests have merged across 30 repositories I don't maintain: [local socket ownership](https://github.com/zeroclaw-labs/zeroclaw/pull/9846) in the zeroclaw runtime, a [focus-indicator hook](https://github.com/adobe/react-spectrum/pull/10426) in Adobe's React Spectrum, a [Windows watcher crash](https://github.com/jestjs/jest/pull/16295) and [virtual mock cache-isolation bug](https://github.com/jestjs/jest/pull/16296) in Jest, a [catalog graph fix](https://github.com/backstage/backstage/pull/35102) in Backstage, a [dead Holesky chain descriptor](https://github.com/NomicFoundation/hardhat/pull/8522) removed from Hardhat, an [MCP release QA skill](https://github.com/github/awesome-copilot/pull/2562) in GitHub's awesome-copilot, and [honest errors for unsupported model architectures](https://github.com/OpenSauce/nam-rs/pull/50) in nam-rs. Twenty-one of the 32 are substantive fixes, features, and tests; the other eleven are accepted listings of Suede's own projects on third-party lists. [Check every one](https://github.com/search?q=is%3Apr+author%3AJasonColapietro+is%3Amerged+-user%3AJasonColapietro+-user%3ASuede-AI&type=pullrequests).

## Changelog

What shipped lately, newest first.

- **Aug 17, 2026** — Two merges the same day: Hardhat dropped its [shipped Holesky chain descriptor](https://github.com/NomicFoundation/hardhat/pull/8522), dead config pointing at explorers that stopped resolving when the Ethereum Foundation shut the testnet down; and the [x402 TypeScript client](https://github.com/x402-foundation/x402/pull/3180) stopped throwing a runtime `TypeError` when a 402 response arrives with no accepted payment requirements.
- **Aug 14, 2026** — Nautobot's Celery worker guide [corrected to the supported `--queues` flag](https://github.com/nautobot/nautobot/pull/9359).
- **Aug 13, 2026** — A [socket-ownership fix](https://github.com/zeroclaw-labs/zeroclaw/pull/9846) merged into the zeroclaw runtime: a second daemon started on the same config could unlink and replace the first one's Unix socket, and bind failures were retried forever instead of failing startup. Same day, [@suedeai/plugin-suede](https://github.com/elizaOS/eliza/pull/19210) landed in the elizaOS plugin registry — Suede music, video, and image generation, payable by agents over x402.
- **Aug 12, 2026** — [useShowFocusIndicator](https://github.com/adobe/react-spectrum/pull/10426) merged into Adobe's React Spectrum, giving React Aria consumers a supported way to switch interaction modality to keyboard and show the focus indicator after a pointer interaction.
- **Aug 11, 2026** — [doc-bridge](https://github.com/AgentsKit-io/doc-bridge/pull/73) GitHub Action examples corrected to v1.3.0 across its docs.
- **Aug 9, 2026** — A safe first-contribution guide with validation and security-reporting boundaries merged into [MyVault](https://github.com/johnnymeunome/MyVault/pull/26).
- **Aug 8, 2026** — Two fixes merged into Jest: a [transient watcher crash on Windows](https://github.com/jestjs/jest/pull/16295), and [virtual mock IDs leaking between module registries](https://github.com/jestjs/jest/pull/16296).
- **Aug 8, 2026** — [Suede Market Maker](https://github.com/Suede-AI/suede-market-maker): rebuilt the dashboard as a proper control desk, on documented tokens instead of ad-hoc styling. Still free, still courtesy of Suede Labs AI.
- **Aug 7, 2026** — MCP release QA skill merged into GitHub's [awesome-copilot](https://github.com/github/awesome-copilot/pull/2562).
- **Aug 6, 2026** — Suede Creator Skills moved to its own home at [skills.suedeai.ai](https://skills.suedeai.ai).
- **Aug 5, 2026** — Catalog graph page configuration fix merged into [Backstage](https://github.com/backstage/backstage/pull/35102).
- **Aug 4, 2026** — Suede Voice and the Suede Guitar Tuner prepped for Google Play, and the Android sign-in dead end in Suede Social fixed.
- **Aug 3, 2026** — Strumly's `/path` became a leveled free course, and the complete edition of The Signal Chain went on sale.

## Contact

[jason@suedeai.ai](mailto:jason@suedeai.ai)
