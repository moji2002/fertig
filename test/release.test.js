const test = require('node:test');
const assert = require('node:assert/strict');
const {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const releaseScript = path.join(root, 'tools', 'sync-release.js');

const run = (command, args, cwd) => spawnSync(command, args, {
  cwd,
  encoding: 'utf8',
});

const runRelease = (cwd, ...args) => run(process.execPath, [releaseScript, ...args], cwd);

const writeJson = (file, value) => {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};

const setVersion = (directory, version) => {
  const manifestPath = path.join(directory, 'package.json');
  const lockPath = path.join(directory, 'package-lock.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  manifest.version = version;
  lock.version = version;
  lock.packages[''].version = version;
  writeJson(manifestPath, manifest);
  writeJson(lockPath, lock);

  for (const name of ['fertig.css', 'fertig.min.css']) {
    const file = path.join(directory, name);
    const css = readFileSync(file, 'utf8').replace(
      /(\/\*! fertig v)\d+\.\d+\.\d+(-[^ ]+)?/,
      `$1${version}`,
    );
    writeFileSync(file, css);
  }
};

const makeFixture = t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'fertig-release-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));

  const tracked = run('git', ['ls-files', '-z'], root).stdout
    .split('\0')
    .filter(Boolean);
  for (const relative of new Set([
    ...tracked,
    'tools/sync-release.js',
  ])) {
    const source = path.join(root, relative);
    if (!existsSync(source)) continue;
    const destination = path.join(directory, relative);
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  }

  setVersion(directory, '1.2.3');
  rmSync(path.join(directory, 'tools', 'release-state.json'), { force: true });
  assert.equal(run('git', ['init', '-q'], directory).status, 0);
  assert.equal(run('git', ['add', '.'], directory).status, 0);
  return directory;
};

test('release sync bumps each changed project fingerprint exactly once', t => {
  const directory = makeFixture(t);
  const initial = runRelease(directory, '--init');
  assert.equal(initial.status, 0, initial.stderr || initial.stdout);

  const siteCss = path.join(directory, 'site.css');
  writeFileSync(siteCss, `${readFileSync(siteCss, 'utf8')}\n/* release test */\n`);

  const changed = runRelease(directory);
  assert.equal(changed.status, 0, changed.stderr || changed.stdout);
  assert.equal(JSON.parse(readFileSync(path.join(directory, 'package.json'))).version, '1.2.4');

  const unchanged = runRelease(directory);
  assert.equal(unchanged.status, 0, unchanged.stderr || unchanged.stdout);
  assert.match(unchanged.stdout, /already synchronized/i);
  assert.equal(JSON.parse(readFileSync(path.join(directory, 'package.json'))).version, '1.2.4');

  writeFileSync(siteCss, `${readFileSync(siteCss, 'utf8')}\n/* another change */\n`);
  const stale = runRelease(directory, '--check');
  assert.notEqual(stale.status, 0);
  assert.match(stale.stderr, /fingerprint/i);

  // A retry after the target version was written but before state was saved
  // must finish that release rather than skip to another patch.
  setVersion(directory, '1.2.5');
  const resumed = runRelease(directory);
  assert.equal(resumed.status, 0, resumed.stderr || resumed.stdout);
  assert.equal(JSON.parse(readFileSync(path.join(directory, 'package.json'))).version, '1.2.5');
  const state = JSON.parse(readFileSync(path.join(directory, 'tools', 'release-state.json')));
  assert.equal(state.version, '1.2.5');
  assert.match(state.sha256, /^[a-f0-9]{64}$/);
});

test('the release workflow rejects metadata drift and npm byte collisions', () => {
  const workflow = readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  const hook = readFileSync(path.join(root, '.githooks', 'pre-commit'), 'utf8');

  assert.match(workflow, /cancel-in-progress:\s*false/);
  assert.match(workflow, /Repository description is out of sync/);
  assert.match(workflow, /npm pack --ignore-scripts --json/);
  assert.match(workflow, /LOCAL_INTEGRITY/);
  assert.match(workflow, /REMOTE_INTEGRITY/);
  assert.match(workflow, /already exists with different bytes/);
  assert.match(workflow, /npm publish "\$PACKAGE_FILE" --ignore-scripts/);
  assert.doesNotMatch(workflow, /npm@latest/);

  assert.match(hook, /npm run release:sync/);
  assert.match(hook, /git add --[\s\S]*tools\/release-state\.json/);
});
