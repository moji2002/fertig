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
    'package.json': (
        ('done — {min_gzip} gzipped, no build step', 1),
    ),
    'README.md': (
        ('**{min_raw} raw · {min_gzip} gzipped · no build step', 1),
        ('`fertig.min.css` is {min_gzip} gzipped.', 1),
        ('| **fertig.min.css** | **{min_raw}** | **{min_gzip}** |', 1),
        ('| `fertig.min.css` | {min_raw} | {min_gzip} | everything |', 1),
    ),
    'llms.txt': (
        ('> {min_raw} raw, {min_gzip} gzipped, no build step', 1),
    ),
    'docs.html': (
        ('<tr><td><code>fertig.min.css</code></td><td>{min_raw}</td><td>{min_gzip}</td></tr>', 1),
        ('<tr><td>fertig.min.css</td><td>{min_raw}</td><td>{min_gzip}</td></tr>', 1),
    ),
    'src/docs.njk': (
        ('<tr><td><code>fertig.min.css</code></td><td>{min_raw}</td><td>{min_gzip}</td></tr>', 1),
        ('<tr><td>fertig.min.css</td><td>{min_raw}</td><td>{min_gzip}</td></tr>', 1),
    ),
    'components.html': (
        ('<tr><td>fertig</td><td align="right">{min_gzip}</td></tr>', 1),
    ),
    'src/components.njk': (
        ('<tr><td>fertig</td><td align="right">{min_gzip}</td></tr>', 1),
    ),
    'index.html': (
        ('<title>fertig — classless CSS framework, no JavaScript, {min_gzip}</title>', 1),
        ('Style semantic HTML with one link tag: dialogs, popovers and tooltips work with no JavaScript. {min_gzip} gzipped', 1),
        # Eleventy emits the shared OG description for both Open Graph and
        # Twitter metadata in the tracked root page.
        ('Built only on CSS every current engine ships. {min_gzip} gzipped', 2),
        ('<span>{min_gzip} gzipped</span>', 2),
        ('<tr><th>Transfer size</th><td>{min_gzip} <span>— fertig.min.css, gzipped</span></td></tr>', 1),
        ('<h2>One complete stylesheet. {min_gzip} transferred.</h2>', 1),
        ('<b>fertig.min.css</b>\n            <span><span class="bar-meter"></span></span><span>{min_gzip}</span>', 1),
        ('reason it is {min_gzip} rather than 20', 1),
    ),
    'src/index.njk': (
        ('title: "fertig \\u2014 classless CSS framework, no JavaScript, {min_gzip}"', 1),
        ('description: "fertig is a classless CSS framework built only on CSS that every current engine already ships. Style semantic HTML with one link tag: dialogs, popovers and tooltips work with no JavaScript. {min_gzip} gzipped', 1),
        ('ogDescription: "Link one stylesheet and semantic HTML comes out designed. Built only on CSS every current engine ships. {min_gzip} gzipped', 1),
        ('<span>{min_gzip} gzipped</span>', 2),
        ('<tr><th>Transfer size</th><td>{min_gzip} <span>— fertig.min.css, gzipped</span></td></tr>', 1),
        ('<h2>One complete stylesheet. {min_gzip} transferred.</h2>', 1),
        ('<b>fertig.min.css</b>\n            <span><span class="bar-meter"></span></span><span>{min_gzip}</span>', 1),
        ('reason it is {min_gzip} rather than 20', 1),
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


def main():
    now = {build: measure(build) for build in BUILDS}
    for build in BUILDS:
        print(f'  {build:<22} {now[build]["raw"]:>9} raw   {now[build]["gzip"]:>8} gzipped')

    if not STATE.exists():
        try:
            plan_updates(now, now)
        except (KeyError, OSError, RuntimeError) as error:
            print(f'\nerror: {error}', file=sys.stderr)
            return 1
        STATE.write_text(json.dumps(now, indent=2) + '\n', encoding='utf-8')
        print('\nfirst run — recorded the current numbers, rewrote nothing.')
        return 0

    was = json.loads(STATE.read_text(encoding='utf-8'))
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
    sys.exit(main())
