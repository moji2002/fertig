#!/usr/bin/env node
/* Builds fertig.min.css from fertig.css,
   and reports transfer sizes. */
const fs = require('fs');
const { gzipSync, brotliCompressSync } = require('zlib');

// A brace imbalance means the minifier ate something it shouldn't have.
const braces = s => (s.match(/{/g) || []).length - (s.match(/}/g) || []).length;

const minifyCss = css => {
  let out = '';
  let quote = null;
  let escaped = false;
  let pendingSpace = false;
  const punctuation = new Set(['{', '}', ';', ',', '>', '~']);

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];

    if (quote) {
      out += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) throw new Error('unterminated CSS comment');
      i = end + 1;
      pendingSpace = true;
      continue;
    }

    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      const previous = out.at(-1);
      const canTrim = !previous || punctuation.has(previous) || previous === ':' ||
        punctuation.has(char);
      if (!canTrim) out += ' ';
      pendingSpace = false;
    }

    if (char === '"' || char === "'") quote = char;
    if (char === '}' && out.at(-1) === ';') out = out.slice(0, -1);
    out += char;
  }

  if (quote) throw new Error('unterminated CSS string');
  return out.trim();
};

const row = (name, buf) =>
  `${name.padEnd(13)} ${String(buf.length).padStart(6)} B  ` +
  `gzip ${String(gzipSync(buf, { level: 9 }).length).padStart(5)} B  ` +
  `brotli ${String(brotliCompressSync(buf).length).padStart(5)} B`;

const build = () => {
  const src = fs.readFileSync('fertig.css', 'utf8');
  const banner = src.match(/\/\*![^]*?\*\//);
  if (!banner) throw new Error('fertig.css is missing its /*! … */ banner');
  if (braces(src) !== 0) throw new Error('unbalanced braces in source');

  const builds = [
    ['fertig.css', src],
    ['fertig.min.css', banner[0] + minifyCss(src) + '\n'],
  ];

  for (const [name, css] of builds) {
    if (braces(css) !== 0) throw new Error(`unbalanced braces in ${name}`);
    if (name !== 'fertig.css') fs.writeFileSync(name, css);
    console.log(row(name, Buffer.from(css)));
  }
};

if (require.main === module) build();

module.exports = { minifyCss };
