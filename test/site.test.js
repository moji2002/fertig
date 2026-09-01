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

test('catalogue starts with an accurate count and a compact mobile toolbar', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const html = readFileSync(path.join(root, 'dist', 'components.html'), 'utf8');
  const source = readFileSync(path.join(root, 'src', 'pages', 'components.astro'), 'utf8');
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');
  const cards = (html.match(/class="comp-card"/g) || []).length;
  const initialCount = Number(html.match(/id="comp-count-num">(\d+)</)?.[1]);

  assert.equal(initialCount, cards, 'the catalogue count has drifted from its cards');
  assert.match(source, /search\.addEventListener\("input", update\);[\s\S]*?\n\s*update\(\);/);
  assert.match(
    css,
    /@media \(width <= 46rem\)[\s\S]*?\.comp-search-wrap\s*\{[^}]*flex-basis:\s*auto/,
    'the desktop search flex-basis becomes vertical blank space on phones',
  );
});

test('navigation links keep native link semantics', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of pages) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    assert.doesNotMatch(html, /<a[^>]*role="button"/, `${page} has a link exposed as a button`);
  }
});

test('every page offers a working keyboard skip link', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of pages) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    assert.match(html, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
    assert.equal((html.match(/<main\b/g) || []).length, 1, `${page} must have one main landmark`);
    assert.match(html, /<main\b[^>]*id="main-content"|<main\s+id="main-content"/);
  }
});

test('the catalogue search uses keyboard-only focus styling', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');

  assert.doesNotMatch(css, /\.comp-search:focus\s*\{/);
  assert.match(css, /\.comp-search:focus-visible\s*\{/);
  assert.doesNotMatch(css, /\.comp-search:focus-visible\s*\{[^}]*outline:\s*none/);
});

test('every dialog example has an accessible name', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of ['index.html', 'components.html', 'blocks.html']) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    const dialogs = [...html.matchAll(/<dialog\b[^>]*>/g)].map(match => match[0]);
    assert.ok(dialogs.length, `${page} has no dialog example`);
    dialogs.forEach(dialog => {
      assert.match(dialog, /aria-(?:label|labelledby)="[^"]+"/, `${page} has an unnamed dialog`);
    });
  }
});

test('the catalogue teaches complete tab markup', () => {
  const source = readFileSync(path.join(root, 'src', 'pages', 'components.astro'), 'utf8');
  const sample = source.match(/<!-- Tabs -->[\s\S]*?<div class="comp-card-code"><code>([\s\S]*?)<\/code>/)?.[1];
  assert.ok(sample, 'the Tabs code sample is missing');
  assert.match(sample, /aria-controls=/);
  assert.match(sample, /role="tabpanel"/);
  assert.match(sample, /aria-labelledby=/);
  assert.match(sample, /tabindex=/);
});

test('the catalogue teaches accessible modern form and list primitives', () => {
  const source = readFileSync(path.join(root, 'src', 'pages', 'components.astro'), 'utf8');
  const otp = source.match(/<input\b[^>]*\bdata-otp\b[^>]*>/)?.[0];
  const listbox = source.match(/<ul\b[^>]*\brole="listbox"[^>]*>/)?.[0];

  assert.match(source, /<div data-field>[\s\S]*?<label for="c-workspace">[\s\S]*?<div data-input-group>/);
  assert.ok(otp, 'the OTP example is missing');
  assert.match(otp, /autocomplete="one-time-code"/);
  assert.match(otp, /inputmode="numeric"/);
  assert.ok(listbox, 'the listbox example is missing');
  assert.match(listbox, /aria-label="Assignee"/);
  assert.match(listbox, /aria-activedescendant=/);
  assert.match(source, /role="option"[^>]*aria-selected="true"/);
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
