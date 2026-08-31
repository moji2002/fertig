#!/usr/bin/env node
/* Builds fertig.min.css from fertig.css,
   and reports transfer sizes. */
const fs = require('fs');
const { gzipSync, brotliCompressSync } = require('zlib');

const src = fs.readFileSync('fertig.css', 'utf8');

const banner = src.match(/\/\*![^]*?\*\//);
if (!banner) throw new Error('fertig.css is missing its /*! … */ banner');

// A brace imbalance means the minifier ate something it shouldn't have.
const braces = s => (s.match(/{/g) || []).length - (s.match(/}/g) || []).length;
if (braces(src) !== 0) throw new Error('unbalanced braces in source');

const minify = css => banner[0] + css
  .replace(/\/\*[^]*?\*\//g, '')        // strip comments (banner re-added above)
  .replace(/\s+/g, ' ')                 // collapse whitespace
  .replace(/\s*([{}:;,>~])\s*/g, '$1')  // trim around punctuation
  .replace(/;}/g, '}')                  // drop the final semicolon in a block
  // #aabbcc -> #abc, #aabbccdd -> #abcd  (shortenHex)
  .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3([0-9a-f])?\4?(?![0-9a-f])/gi,
           (m, r, g, bl, a) => '#' + r + g + bl + (a || ''))
  .trim() + '\n';

const builds = [
  ['fertig.css', src],
  ['fertig.min.css', minify(src)],
];

const row = (name, buf) =>
  `${name.padEnd(13)} ${String(buf.length).padStart(6)} B  ` +
  `gzip ${String(gzipSync(buf, { level: 9 }).length).padStart(5)} B  ` +
  `brotli ${String(brotliCompressSync(buf).length).padStart(5)} B`;

for (const [name, css] of builds) {
  if (braces(css) !== 0) throw new Error(`unbalanced braces in ${name}`);
  if (name !== 'fertig.css') fs.writeFileSync(name, css);
  console.log(row(name, Buffer.from(css)));
}
