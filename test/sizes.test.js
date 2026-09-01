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
  'index.html',
  'docs.html',
  'components.html',
  'README.md',
  'llms.txt',
  'context7.json',
  'src/index.njk',
  'src/docs.njk',
  'src/components.njk',
  'src/blocks.njk',
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

function runSizeSync(root) {
  return spawnSync('python3', ['tools/sizes.py'], {
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
    `| **fertig.min.css** | **${nextState['fertig.min.css'].raw}** | **${nextGzip}** |`,
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
