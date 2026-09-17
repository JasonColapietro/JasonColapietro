# Jupiter 100 — campaign assets

Announcement assets for the give-back campaign: 100 local Jupiter, FL businesses get a free
diagnostic scan, a working website, and an agent-run growth plan. 20 a day for 5 days, built in
public with nightly before-and-afters.

| File | What it is |
|---|---|
| `suede-jupiter-flyer-4x5.png` | The Instagram flyer, 2160×2700 (posts as 1080×1350 at 2×). Ready to upload. |
| `flyer-source.html` | Design source. Fonts and the Suede mark are injected at build time. |
| `build-flyer.mjs` | Inlines Fraunces + Inter as base64 and the real mark from `suede-seo/site/assets/suede-mark.svg`. |
| `render.mjs` | Headless Chromium renderer: `node render.mjs <abs-path-to-html> <out.png> 1080 1350`. |
| `captions.md` | Three caption variants, hashtag set, alternate hooks, Story/Reel version. |

## Rebuilding the flyer

Requires the font packages in a sibling `fonts/` directory (`npm pack @fontsource/fraunces
@fontsource/inter`, extracted) and a clone of `JasonColapietro/suede-seo` at `/home/user/suede-seo`
for the mark.

```
node build-flyer.mjs flyer-source.html flyer.html
node render.mjs "$PWD/flyer.html" out.png 1080 1350
```

## Brand basis

Uses the **social** palette (the one the existing 1080×1080 Instagram card is built on), not the
cobalt institutional system used on seo.suedeai.ai:

- Ground `#080808`, with violet glow top-right and gold glow bottom-left
- Gold `#C8A96E`, gold light `#E7CD97`
- Violet `#8B5CF6`, violet light `#A78BFA`
- Body text `#B4B4B4`, muted `#8D8D8D`
- Frame: 1px `rgba(200,169,110,.22)`, inset 34px, radius 34px
- Display: Fraunces · Text: Inter
