const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const repo = path.resolve(__dirname, '..');
const syncedFiles = [
  'package.json',
  'README.md',
  'llms.txt',
  'src/pages/index.astro',
  'src/pages/docs.astro',
  'src/pages/components.astro',
  'src/components/SiteFooter.astro',
];

function createFixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'fertig-sizes-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  for (const file of ['fertig.css', 'fertig.min.css', ...syncedFiles]) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(repo, file), target);
  }
  mkdirSync(path.join(root, 'tools'), { recursive: true });
  copyFileSync(path.join(repo, 'tools/sizes.py'), path.join(root, 'tools/sizes.py'));
  copyFileSync(path.join(repo, 'tools/sizes.json'), path.join(root, 'tools/sizes.json'));
  return root;
}

function runSizeSync(root, ...args) {
  return spawnSync('python3', ['tools/sizes.py', ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('size sync leaves unrelated matching measurements unchanged', t => {
  const root = createFixture(t);

  const statePath = path.join(root, 'tools/sizes.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const originalGzip = state['fertig.min.css'].gzip;
  const unrelatedGzip = '8.8 KB';

  for (const file of syncedFiles) {
    const target = path.join(root, file);
    const content = readFileSync(target, 'utf8').replaceAll(originalGzip, unrelatedGzip);
    writeFileSync(target, content);
  }
  state['fertig.min.css'].gzip = unrelatedGzip;
  writeFileSync(statePath, JSON.stringify(state, null, 2));
  appendFileSync(path.join(root, 'README.md'), `\nUnrelated asset: ${unrelatedGzip}\n`);

  appendFileSync(
    path.join(root, 'fertig.min.css'),
    `/* ${randomBytes(8192).toString('hex')} */`,
  );

  const result = runSizeSync(root);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const nextState = JSON.parse(readFileSync(statePath, 'utf8'));
  const nextGzip = nextState['fertig.min.css'].gzip;
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');

  assert.notEqual(nextGzip, unrelatedGzip);
  assert.ok(readme.includes(
    `**${nextState['fertig.min.css'].raw} raw · ${nextGzip} gzipped · no build step`,
  ));
  assert.ok(readme.includes(`Unrelated asset: ${unrelatedGzip}`));
});

test('size sync rejects claim drift when build measurements are unchanged', t => {
  const root = createFixture(t);
  const state = JSON.parse(readFileSync(path.join(root, 'tools/sizes.json'), 'utf8'));
  const currentRaw = state['fertig.min.css'].raw;
  const currentGzip = state['fertig.min.css'].gzip;
  const readmePath = path.join(root, 'README.md');
  const before = readFileSync(readmePath, 'utf8');
  const after = before.replace(
    `**${currentRaw} raw · ${currentGzip} gzipped · no build step`,
    '**99.9 KB raw · 99.9 KB gzipped · no build step',
  );
  assert.notEqual(after, before);
  writeFileSync(readmePath, after);

  const result = runSizeSync(root);

  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /size claim manifest is out of date/);
});

test('size check reports stale measurements without rewriting files', t => {
  const root = createFixture(t);
  const statePath = path.join(root, 'tools/sizes.json');
  const readmePath = path.join(root, 'README.md');
  const stateBefore = readFileSync(statePath, 'utf8');
  const readmeBefore = readFileSync(readmePath, 'utf8');

  appendFileSync(
    path.join(root, 'fertig.min.css'),
    `/* ${randomBytes(2048).toString('hex')} */`,
  );
  const result = runSizeSync(root, '--check');

  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /bundle measurements are stale/);
  assert.equal(readFileSync(statePath, 'utf8'), stateBefore);
  assert.equal(readFileSync(readmePath, 'utf8'), readmeBefore);
});

test('size check accepts one display step of gzip runtime variance', t => {
  const root = createFixture(t);
  const statePath = path.join(root, 'tools/sizes.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  const probe = runSizeSync(root, '--check');
  const measuredOutput = probe.stdout.match(
    /fertig\.css\s+[0-9.]+ KB raw\s+([0-9.]+) KB gzipped/,
  );
  assert.ok(measuredOutput, probe.stderr || probe.stdout);

  const measured = Number.parseFloat(measuredOutput[1]);
  state['fertig.css'].gzip = `${(measured + 0.1).toFixed(1)} KB`;
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');

  const result = runSizeSync(root, '--check');

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /compression-runtime tolerance/);
});
