#!/usr/bin/env python3
"""Keep every size claim on the site equal to the built files.

These numbers drifted three separate times while the sheet was being worked on,
and a stale size claim on a page whose pitch includes "small" is the worst kind
of wrong. Run after a build:

    node build.js && python3 tools/sizes.py

How it stays reliable: it records what it last wrote in tools/sizes.json and
replaces exactly those strings next time. No pattern-matching over the prose,
so it cannot mangle an unrelated number — and on a first run it only records,
never rewrites, so it cannot guess wrong either.

CHANGELOG.md is deliberately excluded: a changelog entry records what was true
at that release and must not be retconned.
"""
import gzip, json, os, sys

FILES = ['index.html', 'docs.html', 'README.md', 'llms.txt']
BUILDS = ['fertig.css', 'fertig.min.css', 'fertig.core.min.css']
STATE = os.path.join(os.path.dirname(__file__), 'sizes.json')


def measure(path):
    raw = os.path.getsize(path)
    gz = len(gzip.compress(open(path, 'rb').read(), 9))
    return {'raw': f'{raw / 1024:.1f} KB', 'gzip': f'{gz / 1024:.1f} KB'}


def main():
    now = {b: measure(b) for b in BUILDS}
    for b in BUILDS:
        print(f'  {b:<22} {now[b]["raw"]:>9} raw   {now[b]["gzip"]:>8} gzipped')

    if not os.path.exists(STATE):
        json.dump(now, open(STATE, 'w'), indent=2)
        print('\nfirst run — recorded the current numbers, rewrote nothing.')
        return 0

    was = json.load(open(STATE))
    pairs = [(was[b][k], now[b][k]) for b in BUILDS for k in ('raw', 'gzip')
             if b in was and was[b][k] != now[b][k]]

    if not pairs:
        print('\nclaims already match the build.')
        return 0

    print('\nchanged: ' + ', '.join(f'{o} -> {n}' for o, n in pairs))
    total = 0
    for f in FILES:
        s = before = open(f).read()
        for old, new in pairs:
            s = s.replace(old, new)
        if s != before:
            hits = sum(before.count(o) for o, _ in pairs)
            open(f, 'w').write(s)
            print(f'  {f}: {hits} claim(s) updated')
            total += hits

    json.dump(now, open(STATE, 'w'), indent=2)
    print(f'{total} claim(s) rewritten' if total else 'no claims found to update')
    return 0


if __name__ == '__main__':
    sys.exit(main())
