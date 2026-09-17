import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,, file, out, w, h] = process.argv;
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport:{ width:+w, height:+h }, deviceScaleFactor:2 });
await p.goto('file://' + file, { waitUntil:'networkidle' });
await p.waitForTimeout(400);
await p.screenshot({ path: out });
await b.close();
console.log('rendered', out);
