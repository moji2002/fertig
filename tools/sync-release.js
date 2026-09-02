#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const stateRelative = 'tools/release-state.json';
const statePath = path.join(root, stateRelative);
const stableVersion = /^\d+\.\d+\.\d+$/;

const read = relative => readFileSync(path.join(root, relative), 'utf8');
const writeJson = (relative, value) => {
  writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
};

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
};

const trackedFiles = () => {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'git ls-files failed');
  }
  return result.stdout.split('\0').filter(Boolean).sort();
};

const normalizeVersionMetadata = (relative, contents) => {
  if (relative === 'package.json') {
    return contents.replace(
      /("version"\s*:\s*")[^"]+("\s*,)/,
      '$1<version>$2',
    );
  }
  if (relative === 'package-lock.json') {
    let rootVersions = 0;
    return contents.replace(/("version"\s*:\s*")[^"]+("\s*,)/g, match => {
      rootVersions += 1;
      return rootVersions <= 2 ? match.replace(/:[^:]+$/, ': "<version>",') : match;
    });
  }
  if (relative === 'fertig.css' || relative === 'fertig.min.css') {
    return contents.replace(
      /(\/\*! fertig v)[0-9A-Za-z.+-]+(\s+—)/,
      '$1<version>$2',
    );
  }
  return contents;
};

const fingerprint = () => {
  const hash = createHash('sha256');
  for (const relative of trackedFiles()) {
    if (relative === stateRelative) continue;
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) continue;
    const raw = readFileSync(absolute);
    const normalized = [
      'package.json',
      'package-lock.json',
      'fertig.css',
      'fertig.min.css',
    ].includes(relative)
      ? Buffer.from(normalizeVersionMetadata(relative, raw.toString('utf8')))
      : raw;
    hash.update(relative);
    hash.update('\0');
    hash.update(String(normalized.length));
    hash.update('\0');
    hash.update(normalized);
    hash.update('\0');
  }
  return hash.digest('hex');
};

const versions = () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const bannerVersion = relative => read(relative)
    .match(/\/\*! fertig v([^ ]+) /)?.[1];
  return {
    manifest: manifest.version,
    lock: lock.version,
    lockRoot: lock.packages?.['']?.version,
    source: bannerVersion('fertig.css'),
    minified: bannerVersion('fertig.min.css'),
  };
};

const assertVersion = version => {
  if (!stableVersion.test(version)) {
    throw new Error(`automatic patch releases require stable semver; received ${version}`);
  }
};

const nextPatch = version => {
  assertVersion(version);
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const readState = () => {
  if (!existsSync(statePath)) {
    throw new Error('release state is missing; bootstrap it with --init');
  }
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  assertVersion(state.version);
  if (!/^[a-f0-9]{64}$/.test(state.sha256 || '')) {
    throw new Error('release state does not contain a valid SHA-256 fingerprint');
  }
  return state;
};

const assertVersionsMatch = expected => {
  const found = versions();
  for (const [location, version] of Object.entries(found)) {
    if (version !== expected) {
      throw new Error(`${location} version is ${version || 'missing'}; expected ${expected}`);
    }
  }
};

const setVersion = version => {
  assertVersion(version);
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  manifest.version = version;
  lock.version = version;
  lock.packages[''].version = version;
  writeJson('package.json', manifest);
  writeJson('package-lock.json', lock);

  const source = read('fertig.css').replace(
    /(\/\*! fertig v)[0-9A-Za-z.+-]+(\s+—)/,
    `$1${version}$2`,
  );
  writeFileSync(path.join(root, 'fertig.css'), source);
};

const build = () => run(process.execPath, ['build.js']);
const syncSizes = () => run('python3', ['tools/sizes.py']);

const initialize = () => {
  if (existsSync(statePath)) throw new Error('release state already exists');
  const current = versions().manifest;
  assertVersion(current);
  build();
  syncSizes();
  assertVersionsMatch(current);
  const state = { version: current, sha256: fingerprint() };
  writeJson(stateRelative, state);
  console.log(`Initialized release fingerprint for v${current}.`);
};

const check = () => {
  const state = readState();
  assertVersionsMatch(state.version);
  const current = fingerprint();
  if (current !== state.sha256) {
    throw new Error('project fingerprint changed; run npm run release:sync');
  }
  console.log(`Release fingerprint matches v${state.version}.`);
};

const sync = () => {
  const state = readState();
  const target = nextPatch(state.version);
  const currentVersion = versions().manifest;
  if (![state.version, target].includes(currentVersion)) {
    throw new Error(
      `manifest version ${currentVersion} is neither released ${state.version} nor retry target ${target}`,
    );
  }

  build();
  const current = fingerprint();
  if (current === state.sha256) {
    assertVersionsMatch(state.version);
    console.log(`Release v${state.version} is already synchronized.`);
    return;
  }

  setVersion(target);
  build();
  syncSizes();
  assertVersionsMatch(target);

  // State is deliberately last. If any earlier step fails, the next run uses
  // the same target patch instead of incrementing a second time.
  writeJson(stateRelative, { version: target, sha256: fingerprint() });
  console.log(`Prepared release v${target}.`);
};

try {
  const [flag, ...rest] = process.argv.slice(2);
  if (rest.length || (flag && !['--check', '--init'].includes(flag))) {
    throw new Error('usage: node tools/sync-release.js [--check|--init]');
  }
  if (flag === '--check') check();
  else if (flag === '--init') initialize();
  else sync();
} catch (error) {
  console.error(`Release sync failed: ${error.message}`);
  process.exitCode = 1;
}
