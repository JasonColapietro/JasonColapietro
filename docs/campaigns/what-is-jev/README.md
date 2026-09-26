# What is Jev?

An Instagram post (4:5) explaining Jev, TypeSafe AI's "System One" model, in the navy and gold scheme of `ig/south-florida-ig-gold.jpg` on the `social-assets` branch.

| File | Role |
|---|---|
| `post-source.html` | Card template. `/*FONTS*/` is replaced with inlined font faces at build time. |
| `build.mjs` | Inlines the fonts and renders the card to PNG through headless Chromium. |
| `what-is-jev-4x5.png` | The rendered card, 2160×2700 (1080×1350 at 2x). |
| `caption.md` | Caption, hashtags, sources, and checks to do before posting. |

Rebuild:

```sh
# fetch fonts once
for p in fraunces inter jetbrains-mono; do npm pack @fontsource/$p && mkdir -p fonts/$p && tar xzf fontsource-$p-*.tgz -C fonts/$p; done
node build.mjs ./fonts what-is-jev-4x5.png
```
