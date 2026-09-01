#!/usr/bin/env node

const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { version } = require('../package.json');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = ['index.html', 'docs.html', 'components.html', 'blocks.html'];
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const page of pages) {
  const file = path.join(output, page);
  expect(existsSync(file), `${page} was not generated`);
  if (!existsSync(file)) continue;

  const html = readFileSync(file, 'utf8');
  const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0]);
  const ids = tags.flatMap(tag => {
    const match = tag.match(/\sid="([^"]+)"/);
    return match ? [match[1]] : [];
  });
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const anchors = tags.flatMap(tag => {
    const match = tag.match(/^<a\b[^>]*\shref="#([^"]*)"/i);
    return match ? [match[1]] : [];
  })
    .filter(Boolean);
  const images = tags.filter(tag => /^<img\b/i.test(tag));

  expect(/^<!doctype html>/i.test(html), `${page} has no doctype`);
  expect(/<html\s+lang="en">/.test(html), `${page} has no document language`);
  expect(/<meta\s+name="viewport"/.test(html), `${page} has no viewport metadata`);
  expect((html.match(/<h1\b/g) || []).length === 1, `${page} must have one h1`);
  expect((html.match(/aria-current="page"/g) || []).length === 1,
    `${page} must identify one current navigation item`);
  expect(duplicateIds.length === 0,
    `${page} has duplicate ids: ${duplicateIds.join(', ')}`);
  expect(images.every(attributes => /\salt="[^"]*"/.test(attributes)),
    `${page} has an image without alt text`);

  for (const anchor of anchors) {
    expect(ids.includes(decodeURIComponent(anchor)),
      `${page} links to missing #${anchor}`);
  }

  for (const tag of tags) {
    for (const match of tag.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      const reference = match[1];
      if (/^(?:[a-z]+:|\/\/|\/|#)/i.test(reference)) continue;
      const clean = reference.split(/[?#]/, 1)[0];
      if (!clean) continue;
      let decoded = clean;
      try { decoded = decodeURIComponent(clean); } catch { /* reported as missing below */ }
      const target = path.resolve(path.dirname(file), decoded);
      expect(target.startsWith(output + path.sep) && existsSync(target),
        `${page} links to missing local file: ${reference}`);
    }
  }

  for (const value of ['⌘', 'macOS', 'Macintosh', 'Concrete.css', 'matcha.css', 'Pico']) {
    expect(!html.includes(value), `${page} contains retired public copy`);
  }
}

if (existsSync(path.join(output, 'index.html'))) {
  const homepage = readFileSync(path.join(output, 'index.html'), 'utf8');
  expect(homepage.includes(`"softwareVersion": "${version}"`),
    'generated schema version is stale');
  expect(homepage.includes(`v${version}`), 'generated homepage version is stale');
}

if (failures.length) {
  console.error('Site checks failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Site checks passed for ${pages.length} pages.`);
