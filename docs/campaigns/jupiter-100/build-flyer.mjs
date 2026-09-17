import fs from 'fs';
const b64 = p => fs.readFileSync(p).toString('base64');
const face = (fam, file, wt) =>
`@font-face{font-family:"${fam}";font-weight:${wt};font-style:normal;font-display:block;
src:url(data:font/woff2;base64,${b64(file)}) format("woff2");}`;
const FR='./fonts/fontsource-fraunces-5.3.0/package/files/';
const IN='./fonts/fontsource-inter-x/package/files/';
const css = [
  face('Fraunces',FR+'fraunces-latin-400-normal.woff2',400),
  face('Fraunces',FR+'fraunces-latin-600-normal.woff2',600),
  face('Fraunces',FR+'fraunces-latin-700-normal.woff2',700),
  face('Fraunces',FR+'fraunces-latin-900-normal.woff2',900),
  face('Inter',IN+'inter-latin-400-normal.woff2',400),
  face('Inter',IN+'inter-latin-600-normal.woff2',600),
  face('Inter',IN+'inter-latin-700-normal.woff2',700),
  face('Inter',IN+'inter-latin-800-normal.woff2',800),
].join('\n');
// inline the real Suede mark, stripped of comments, recolorable via currentColor
let mark = fs.readFileSync('/home/user/suede-seo/site/assets/suede-mark.svg','utf8')
  .replace(/<!--[\s\S]*?-->/g,'').replace(/<title>.*?<\/title>/g,'').trim();
const tpl = fs.readFileSync(process.argv[2],'utf8');
fs.writeFileSync(process.argv[3], tpl.replace('/*FONTS*/', css).replace('<!--MARK-->', mark));
console.log('built', process.argv[3], (fs.statSync(process.argv[3]).size/1024|0)+'KB');
