#!/usr/bin/env node

const { readFileSync } = require('node:fs');

const parsePackResult = input => {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('npm pack did not return package metadata');
  }

  // npm <=11 returns an array; npm 12 returns an object keyed by package name.
  const packages = Array.isArray(parsed) ? parsed : Object.values(parsed);
  if (packages.length !== 1) {
    throw new Error(`npm pack must return exactly one package; received ${packages.length}`);
  }

  const { filename, integrity } = packages[0] || {};
  if (typeof filename !== 'string' || !filename || /[\r\n]/.test(filename)) {
    throw new Error('npm pack metadata is missing a valid filename');
  }
  if (typeof integrity !== 'string' || !integrity || /[\r\n]/.test(integrity)) {
    throw new Error('npm pack metadata is missing a valid integrity');
  }

  return { filename, integrity };
};

if (require.main === module) {
  try {
    const { filename, integrity } = parsePackResult(readFileSync(0, 'utf8'));
    process.stdout.write(`file=${filename}\nintegrity=${integrity}\n`);
  } catch (error) {
    console.error(`Could not read npm pack metadata: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { parsePackResult };
