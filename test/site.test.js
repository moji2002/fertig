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
  assert.match(
    css,
    /@media \(width <= 46rem\)[\s\S]*?\.comp-filters\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible;/,
    'the mobile filter controls should wrap instead of looking clipped',
  );
});

test('the install examples reflow before their code becomes cramped', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');
  const source = readFileSync(path.join(root, 'src', 'pages', 'docs.astro'), 'utf8');

  assert.match(css, /\.doc-body > #install \.cols-2\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /@container doc \(width >= 44rem\)[\s\S]*?\.doc-body > #install \.cols-2/);
  assert.match(css, /\.doc-body > #install pre code\s*\{[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere;/);
  assert.match(css, /main > #install\s*\{/);
  assert.doesNotMatch(css, /\n#install\s*\{/);
  assert.match(source, /https:\/\/cdn\.jsdelivr\.net\/npm\/fertig@4\/fertig\.min\.css/);
});

test('every catalogue component exposes a working copy action', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const html = readFileSync(path.join(root, 'dist', 'components.html'), 'utf8');
  const script = readFileSync(path.join(root, 'site.js'), 'utf8');
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');
  const cards = (html.match(/class="comp-card"/g) || []).length;
  const snippets = (html.match(/class="comp-card-code"/g) || []).length;

  assert.equal(snippets, cards, 'every component card needs copyable markup');
  assert.match(script, /document\.querySelectorAll\("\.comp-card-code"\)\.forEach/);
  assert.match(script, /navigator\.clipboard\.writeText\(code\.textContent\)/);
  assert.match(script, /button\.dataset\.copyComponent = ""/);
  assert.match(css, /\.comp-copy\[data-copied\]/);
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

test('every page has a large social sharing preview', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of pages) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    assert.match(html, /<meta property="og:image" content="https:\/\/moji2002\.github\.io\/fertig\/og\.png">/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/moji2002\.github\.io\/fertig\/og\.png">/);
  }
});

test('the catalogue search uses keyboard-only focus styling', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');

  assert.doesNotMatch(css, /\.comp-search:focus\s*\{/);
  assert.match(css, /\.comp-search:focus-visible\s*\{/);
  assert.doesNotMatch(css, /\.comp-search:focus-visible\s*\{[^}]*outline:\s*none/);
});

test('the site navigation uses one aligned control box', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');

  assert.match(
    css,
    /\.bar ul a\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;/,
  );
});

test('block demos keep their chrome clear and content product-sized', () => {
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');

  assert.match(
    css,
    /@media \(width >= 60rem\)[\s\S]*?\.sidebar > details\s*\{[^}]*box-shadow:\s*none;/,
  );
  assert.match(
    css,
    /\.block-preview > form\s*\{[^}]*inline-size:\s*min\(100%, 30rem\);[^}]*margin-inline:\s*auto;/,
  );
  assert.match(css, /\.block-preview dialog\s*\{[^}]*width:\s*min\(36rem,/);
  assert.match(css, /\.block-code > summary\s*\{[^}]*padding-inline-end:\s*6rem;/);
  assert.match(css, /\.block-code button\s*\{[^}]*inset-block-start:\s*\.3rem;/);
  assert.match(
    css,
    /\.block-code pre\s*\{[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere;/,
  );
  assert.match(
    css,
    /\.comp-card-code code\s*\{[^}]*min-width:\s*0;[^}]*white-space:\s*pre-wrap;[^}]*overflow-wrap:\s*anywhere;/,
  );
});

test('catalogue and block dialog examples have accessible names', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);

  for (const page of ['components.html', 'blocks.html']) {
    const html = readFileSync(path.join(root, 'dist', page), 'utf8');
    const dialogs = [...html.matchAll(/<dialog\b[^>]*>/g)].map(match => match[0]);
    assert.ok(dialogs.length, `${page} has no dialog example`);
    dialogs.forEach(dialog => {
      assert.match(dialog, /aria-(?:label|labelledby)="[^"]+"/, `${page} has an unnamed dialog`);
    });
  }
});

test('the landing page has no intrusive modal demo', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const html = readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');

  assert.doesNotMatch(html, /<dialog\b/);
});

test('the hero workbench renders editable HTML in a sandboxed live preview', () => {
  assert.equal(build.status, 0, build.stderr || build.stdout);
  const html = readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const script = readFileSync(path.join(root, 'site.js'), 'utf8');
  const css = readFileSync(path.join(root, 'site.css'), 'utf8');
  const preview = html.match(/<iframe\b[^>]*data-hero-preview[^>]*>/)?.[0];

  assert.match(html, /<textarea\b[^>]*data-hero-editor[^>]*aria-describedby="hero-editor-help"[^>]*wrap="soft"/);
  assert.match(html, /&lt;button commandfor=&quot;new&quot; command=&quot;show-modal&quot;&gt;/);
  assert.match(html, /&lt;dialog id=&quot;new&quot; closedby=&quot;any&quot;\s+aria-labelledby=&quot;new-title&quot;&gt;/);
  assert.doesNotMatch(html, /&lt;form popover id=&quot;new&quot;/);
  assert.match(html, /&lt;section data-surface&gt;/);
  assert.match(html, /&lt;table&gt;/);
  assert.match(html, /data-hero-highlight data-highlighted/);
  assert.ok(preview, 'the hero live preview iframe is missing');
  assert.match(preview, /title="Live rendered HTML preview"/);
  assert.match(preview, /\ssandbox="allow-same-origin"/);
  assert.doesNotMatch(preview, /allow-scripts/);
  assert.match(script, /hljs\.highlight\(editor\.value/);
  assert.match(script, /editor\.offsetWidth - editor\.clientWidth/);
  assert.match(
    script,
    /editor\.addEventListener\("input", \(\) => \{[\s\S]*?cancelIdleDemo\(\);[\s\S]*?scheduleUpdate\(\);/,
  );
  assert.match(script, /editor\.addEventListener\("scroll"/);
  assert.match(script, /preview\.srcdoc =/);
  assert.match(script, /Content-Security-Policy/);
  assert.match(script, /const idleStages = \["<\/hgroup>", "<\/section>", "<\/table>"\]/);
  assert.match(script, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(script, /new IntersectionObserver\([\s\S]*?startIdleDemo/);
  assert.match(script, /entry\.intersectionRatio >= \.25/);
  assert.match(script, /\["focus", "pointerdown", "keydown"\][\s\S]*?cancelIdleDemo/);
  assert.match(script, /reset\?\.addEventListener\("click"/);
  assert.match(css, /\.workbench-highlight,[\s\S]*?max-block-size:\s*none;[\s\S]*?white-space:\s*pre-wrap;\s*overflow-wrap:\s*anywhere/);
  assert.match(css, /\.workbench-highlight\s*\{[^}]*overflow:\s*hidden;[^}]*scrollbar-gutter:\s*auto;/);
  assert.match(css, /padding-inline-end:\s*calc\(1rem \+ var\(--workbench-editor-gutter, 0px\)\)/);
  assert.match(css, /\.workbench-highlight code\s*\{[^}]*min-width:\s*0/);
});

test('block copy markup removes Astro development metadata', () => {
  const source = readFileSync(path.join(root, 'src', 'pages', 'blocks.astro'), 'utf8');

  assert.match(source, /preview\.cloneNode\(true\)/);
  assert.match(source, /name\.startsWith\(['"]data-astro-source-['"]\)/);
  assert.match(source, /removeAttribute\(name\)/);
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
