// Usage: node build.mjs <fontsDir> <out.png>
// fontsDir holds unpacked @fontsource/{fraunces,inter,jetbrains-mono} packages.
import fs from 'fs';
import path from 'path';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, fontsDir, out] = process.argv;
const here = path.dirname(new URL(import.meta.url).pathname);
const face = (fam, pkg, file, wt, st = 'normal') =>
  `@font-face{font-family:"${fam}";font-weight:${wt};font-style:${st};font-display:block;` +
  `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fontsDir, pkg, 'package/files', file)).toString('base64')}) format("woff2");}`;
const css = [
  face('Fraunces', 'fraunces', 'fraunces-latin-700-normal.woff2', 700),
  face('Fraunces', 'fraunces', 'fraunces-latin-700-italic.woff2', 700, 'italic'),
  ...[400, 500, 600, 700].map(w => face('Inter', 'inter', `inter-latin-${w}-normal.woff2`, w)),
  face('JetBrains Mono', 'jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2', 500),
].join('\n');
const html = fs.readFileSync(path.join(here, 'post-source.html'), 'utf8').replace('/*FONTS*/', css);
const built = path.join(path.dirname(path.resolve(out)), '.post-built.html');
fs.writeFileSync(built, html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
await p.goto('file://' + built, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out });
await b.close();
fs.unlinkSync(built);
console.log('rendered', out);
