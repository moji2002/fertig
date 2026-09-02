#!/usr/bin/env python3
"""Measure the builds and update only explicitly managed size claims.

Each template below is a stable, fertig-specific context. This is intentionally
more verbose than replacing every matching number: another library can have the
same size, and its measurement must never move when fertig does. If a managed
sentence changes shape, the command fails and asks for this manifest to be
updated instead of silently guessing.
"""
import gzip
import json
import os
import sys
from pathlib import Path


BUILDS = ('fertig.css', 'fertig.min.css')
STATE = Path(__file__).with_name('sizes.json')

# (literal template, expected occurrence count). Available fields are
# {source_raw}, {source_gzip}, {min_raw}, and {min_gzip}.
CLAIMS = {
    'README.md': (
        ('**{min_raw} raw · {min_gzip} gzipped · no build step', 1),
    ),
    'llms.txt': (
        ('> {min_raw} raw, {min_gzip} gzipped, no build step', 1),
    ),
    'src/pages/docs.astro': (
        ('<tr><td><code>fertig.min.css</code></td><td>{min_raw}</td><td>{min_gzip}</td></tr>', 1),
    ),
    'src/pages/components.astro': (
        ('<tr><td>fertig</td><td align="right">{min_gzip}</td></tr>', 1),
    ),
    'src/pages/index.astro': (
        ('const title = "fertig — classless CSS framework, no JavaScript, {min_gzip}";', 1),
        ('interface: dialogs, popovers, forms, and data views in {min_gzip} gzipped', 1),
        ('semantic HTML comes out designed. {min_gzip} gzipped', 1),
        ('<div><dt>{min_gzip}</dt><dd>gzipped</dd></div>', 1),
        ('reason it is {min_gzip} rather than 20', 1),
    ),
    'src/components/SiteFooter.astro': (
        ('<span>{min_gzip} gzipped</span>', 1),
    ),
}


def measure(path):
    raw = os.path.getsize(path)
    with open(path, 'rb') as source:
        compressed = len(gzip.compress(source.read(), 9))
    return {'raw': f'{raw / 1024:.1f} KB', 'gzip': f'{compressed / 1024:.1f} KB'}


def values(measurements):
    return {
        'source_raw': measurements['fertig.css']['raw'],
        'source_gzip': measurements['fertig.css']['gzip'],
        'min_raw': measurements['fertig.min.css']['raw'],
        'min_gzip': measurements['fertig.min.css']['gzip'],
    }


def plan_updates(before, after):
    old_values = values(before)
    new_values = values(after)
    planned = {}
    failures = []
    claim_count = 0

    for filename, sites in CLAIMS.items():
        path = Path(filename)
        content = path.read_text(encoding='utf-8')
        updated = content

        for template, expected in sites:
            old = template.format(**old_values)
            new = template.format(**new_values)
            if old == new:
                current_count = updated.count(new)
                if current_count != expected:
                    failures.append(
                        f'{filename}: expected {expected} managed claim(s), '
                        f'found {current_count}'
                    )
                continue

            old_count = updated.count(old)
            new_count = updated.count(new)
            if old_count == expected:
                updated = updated.replace(old, new)
                claim_count += expected
            elif old_count == 0 and new_count == expected:
                # The claim was already updated manually; leave it alone.
                continue
            else:
                failures.append(
                    f'{filename}: expected {expected} managed claim(s), '
                    f'found {old_count} old and {new_count} new'
                )

        if updated != content:
            planned[path] = updated

    if failures:
        raise RuntimeError('size claim manifest is out of date:\n  ' + '\n  '.join(failures))
    return planned, claim_count


def main(check=False):
    now = {build: measure(build) for build in BUILDS}
    for build in BUILDS:
        print(f'  {build:<22} {now[build]["raw"]:>9} raw   {now[build]["gzip"]:>8} gzipped')

    if not STATE.exists():
        if check:
            print('\nerror: size state is missing; run npm run sizes', file=sys.stderr)
            return 1
        try:
            plan_updates(now, now)
        except (KeyError, OSError, RuntimeError) as error:
            print(f'\nerror: {error}', file=sys.stderr)
            return 1
        STATE.write_text(json.dumps(now, indent=2) + '\n', encoding='utf-8')
        print('\nfirst run — recorded the current numbers, rewrote nothing.')
        return 0

    was = json.loads(STATE.read_text(encoding='utf-8'))

    if check:
        try:
            # Claims describe the recorded display values. Validate those
            # contexts independently from today's compressor: zlib releases
            # can produce slightly different byte streams for identical CSS.
            plan_updates(was, was)
        except (KeyError, OSError, RuntimeError) as error:
            print(f'\nerror: {error}', file=sys.stderr)
            return 1

        failures = []
        tolerated = []
        for build in BUILDS:
            if was[build]['raw'] != now[build]['raw']:
                failures.append(
                    f'{build} raw: recorded {was[build]["raw"]}, '
                    f'measured {now[build]["raw"]}'
                )
            if was[build]['gzip'] != now[build]['gzip']:
                before = float(was[build]['gzip'].removesuffix(' KB'))
                current = float(now[build]['gzip'].removesuffix(' KB'))
                if abs(before - current) <= 0.1000001:
                    tolerated.append(
                        f'{build} gzip {was[build]["gzip"]} / {now[build]["gzip"]}'
                    )
                else:
                    failures.append(
                        f'{build} gzip: recorded {was[build]["gzip"]}, '
                        f'measured {now[build]["gzip"]}'
                    )

        if failures:
            print(
                '\nerror: bundle measurements are stale:\n  ' + '\n  '.join(failures) +
                '\nrun npm run build, then npm run sizes',
                file=sys.stderr,
            )
            return 1
        if tolerated:
            print('\ncompression-runtime tolerance: ' + ', '.join(tolerated))
        print('\nclaims match the recorded build.')
        return 0

    try:
        planned, claim_count = plan_updates(was, now)
    except (KeyError, OSError, RuntimeError) as error:
        print(f'\nerror: {error}', file=sys.stderr)
        return 1

    changes = [
        (was[build][kind], now[build][kind])
        for build in BUILDS
        for kind in ('raw', 'gzip')
        if was[build][kind] != now[build][kind]
    ]
    if not changes:
        print('\nclaims already match the build.')
        return 0

    print('\nchanged: ' + ', '.join(f'{old} -> {new}' for old, new in changes))
    for path, content in planned.items():
        path.write_text(content, encoding='utf-8')
        print(f'  {path}: updated')

    STATE.write_text(json.dumps(now, indent=2) + '\n', encoding='utf-8')
    print(f'{claim_count} managed claim(s) rewritten')
    return 0


if __name__ == '__main__':
    unknown = [arg for arg in sys.argv[1:] if arg != '--check']
    if unknown:
        print(f'error: unknown argument: {unknown[0]}', file=sys.stderr)
        sys.exit(2)
    sys.exit(main(check='--check' in sys.argv[1:]))
