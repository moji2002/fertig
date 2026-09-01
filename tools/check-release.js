#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { brotliCompressSync, gzipSync } = require('node:zlib');
const { minifyCss } = require('../build.js');

const root = path.resolve(__dirname, '..');
const failures = [];
const read = file => readFileSync(path.join(root, file), 'utf8');
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};
const format = bytes => `${(bytes / 1024).toFixed(1)} KB`;

const manifest = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const version = manifest.version;
const major = version.split('.')[0];

expect(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version),
  `package version is not valid semver: ${version}`);
expect(lock.version === version, 'package-lock.json top-level version is stale');
expect(lock.packages?.['']?.version === version,
  'package-lock.json root package version is stale');
expect(read('CHANGELOG.md').includes(`## [${version}]`),
  `CHANGELOG.md has no ${version} release entry`);

const source = read('fertig.css');
const minified = read('fertig.min.css');
const banner = source.match(/\/\*![^]*?\*\//)?.[0];
expect(Boolean(banner), 'fertig.css is missing its release banner');
if (banner) {
  expect(banner.includes(`fertig v${version}`),
    `fertig.css banner does not use v${version}`);
  const generated = `${banner}${minifyCss(source)}\n`;
  expect(minified === generated,
    'fertig.min.css is stale; run npm run build');
}
expect(minified.startsWith(`/*! fertig v${version} `),
  `fertig.min.css banner does not use v${version}`);

const bytes = Buffer.from(minified);
const sizes = {
  raw: bytes.length,
  gzip: gzipSync(bytes, { level: 9 }).length,
  brotli: brotliCompressSync(bytes).length,
};
const budgets = {
  raw: 40 * 1024,
  gzip: 9 * 1024,
  brotli: 8 * 1024,
};
for (const kind of Object.keys(budgets)) {
  expect(sizes[kind] <= budgets[kind],
    `${kind} bundle is ${sizes[kind]} B; budget is ${budgets[kind]} B`);
}

const recorded = JSON.parse(read('tools/sizes.json'));
for (const file of ['fertig.css', 'fertig.min.css']) {
  const content = Buffer.from(read(file));
  const actual = {
    raw: format(content.length),
    gzip: format(gzipSync(content, { level: 9 }).length),
  };
  expect(recorded[file]?.raw === actual.raw,
    `tools/sizes.json raw measurement is stale for ${file}`);
  expect(recorded[file]?.gzip === actual.gzip,
    `tools/sizes.json gzip measurement is stale for ${file}`);
}

const indexSource = read('src/index.njk');
expect(indexSource.includes(`"softwareVersion": "${version}"`),
  `site schema softwareVersion does not use ${version}`);

for (const file of ['README.md', 'src/docs.njk']) {
  const pins = [...read(file).matchAll(/cdn\s*\.jsdelivr\.net\/npm\/fertig@(\d+)/g)]
    .map(match => match[1]);
  expect(pins.length === 1, `${file} must contain one pinned CDN example`);
  expect(pins.every(pin => pin === major),
    `${file} CDN example must use fertig@${major}`);
}

const readme = read('README.md');
expect(readme.includes('/bundlephobia/min/fertig?'),
  'README.md is missing the minified-size badge');
expect(readme.includes('/bundlephobia/minzip/fertig?'),
  'README.md is missing the minified+gzip badge');

for (const file of manifest.files) {
  expect(existsSync(path.join(root, file)), `package file does not exist: ${file}`);
}
for (const [key, target] of Object.entries(manifest.exports)) {
  if (typeof target !== 'string') continue;
  expect(existsSync(path.join(root, target.replace(/^\.\//, ''))),
    `package export ${key} points to missing file ${target}`);
}

const publicFiles = [
  'README.md', 'index.html', 'docs.html', 'components.html', 'blocks.html',
  'llms.txt', 'src/index.njk', 'src/docs.njk', 'src/components.njk',
  'src/blocks.njk', 'src/_includes/layout.njk',
];
const forbiddenCopy = [
  ['platform-specific command symbol', '⌘'],
  ['platform-specific product name', 'macOS'],
  ['platform-specific product name', 'Macintosh'],
  ['external comparison name', 'Concrete.css'],
  ['external comparison name', 'matcha.css'],
  ['external comparison name', 'Pico'],
];
for (const file of publicFiles) {
  const content = read(file);
  for (const [label, value] of forbiddenCopy) {
    expect(!content.includes(value), `${file} contains ${label}`);
  }
}

const tracked = spawnSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8',
});
expect(tracked.status === 0, 'could not inspect tracked files');
if (tracked.status === 0) {
  const retired = tracked.stdout.trim().split('\n').filter(file =>
    /(^|\/)(?:app|app-invoice)\.html$/i.test(file) ||
    /(^|\/)dogfood-output\//i.test(file) ||
    /(^|\/).*screenshot.*\.(?:png|jpe?g|webp)$/i.test(file));
  expect(retired.length === 0,
    `retired mockup or screenshot artifact is tracked: ${retired.join(', ')}`);
}

if (failures.length) {
  console.error('Release checks failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Release metadata: v${version}`);
console.log(
  `Bundle: ${format(sizes.raw)} raw · ${format(sizes.gzip)} gzip · ` +
  `${format(sizes.brotli)} brotli`,
);
console.log('Release checks passed.');
