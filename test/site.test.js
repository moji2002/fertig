const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'docs.html', 'components.html', 'blocks.html'];

const build = spawnSync('npm', ['run', 'site', '--silent'], {
  cwd: root,
  encoding: 'utf8',
});

test('every generated page uses the same shared footer', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const footers = pages.map(page => {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    const footer = [...html.matchAll(/<footer>[\s\S]*?<\/footer>/g)].at(-1)?.[0];
    assert.ok(footer, `${page} has no footer`);
    return footer.replace(/\s+/g, ' ').trim();
  });

  assert.equal(new Set(footers).size, 1, 'generated footers have drifted apart');
});

test('every inner page uses the same header landmarks', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of pages.slice(1)) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    const header = html.match(/<header class="band page-head">[\s\S]*?<\/header>/)?.[0];
    assert.ok(header, `${page} has no page header`);
    assert.match(header, /<nav aria-label="Breadcrumb">/, `${page} has no breadcrumb`);
    assert.match(header, /<h1 class="page-title">/, `${page} has no page title`);
    assert.match(header, /<p class="muted page-intro">/, `${page} has no page introduction`);
  }
});

test('documentation links to the visual catalogue instead of repeating it', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const html = readFileSync(path.join(root, 'dist', 'docs.html'), 'utf8');

  assert.match(html, /href="components\.html"[^>]*>Browse the component catalogue/);
  assert.ok(
    (html.match(/class="example"/g) || []).length <= 1,
    'documentation repeats live examples already present in the catalogue',
  );
});

test('catalogue filters can hide cards', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');

  assert.match(
    css,
    /\.comp-card\[hidden\]\s*\{\s*display:\s*none\s*\}/,
    'the card display rule overrides the native hidden attribute',
  );
});

test('every visual tab is a complete keyboard-operable widget', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of ['index.html', 'components.html', 'blocks.html']) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map(match => match[0]);
    assert.ok(tabs.length, `${page} has no tabs`);
    for (const tab of tabs) {
      const controls = tab.match(/aria-controls="([^"]+)"/)?.[1];
      assert.ok(controls, `${page} has a tab without aria-controls`);
      assert.match(
        html,
        new RegExp(`id="${controls}"[^>]*role="tabpanel"|role="tabpanel"[^>]*id="${controls}"`),
      );
    }
  }

  const script = readFileSync(path.join(root, 'site.js'), 'utf8');
  assert.match(script, /item\.tabIndex = on \? 0 : -1/);
  assert.match(script, /event\.key === "Home"/);
  assert.match(script, /event\.key === "End"/);
});
