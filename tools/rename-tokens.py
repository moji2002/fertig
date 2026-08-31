#!/usr/bin/env python3
"""Rename the public design tokens to a --fertig- prefix (breaking).

The unprefixed vocabulary (--w, --r, --bg, --ac, ...) collides with arbitrary
authors' own custom properties, so as of v3.0.0 every shipped token carries the
--fertig- namespace the @property registrations already use. Old names are
dropped, not aliased — this is a deliberate breaking change.

The mapping is ordered longest-token-first so no replacement swallows another
(--r must not turn --rw into --fertig-fertig-rw). Only the bare token name is
rewritten, wherever it appears: definitions, var() references, and the comments
that name a token.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOKENS = [
    'ease-in', 'ease-out', 'on-ac', 'dur-1', 'dur-2',
] + [f'{h}-{s}' for h in ('stone', 'sage', 'sky', 'clay', 'plum', 'gold')
     for s in (100, 300, 500, 700, 900)] + [
    'syn-attr', 'syn-comment', 'syn-fn', 'syn-key', 'syn-num', 'syn-str',
    'face', 'mut', 'fertig-a1', 'fertig-a2',
] + ['bg', 'el', 'fg', 'bd', 'tb', 'ac', 'sh', 'sh1', 'sh2', 'up', 'up2',
     'dn', 'w', 'r', 'rs', 'rw', 'f', 'fm', 'caps', 'nw', 'ease']
TOKENS.sort(key=len, reverse=True)


def renamed(tok):
    if tok.startswith('fertig-'):
        return tok
    return f'fertig-{tok}'


def pair(tok):
    return f'--{tok}', f'--{renamed(tok)}'


# longest-first alternation so --r never matches inside --rw
ALTERNATION = '|'.join(re.escape(f'--{t}') for t in TOKENS)
PATTERN = re.compile(r'(?<![\w-])(' + ALTERNATION + r')(?![\w-])')


def rename_text(s):
    return PATTERN.sub(lambda m: '--' + renamed(m.group(1)[2:]), s)


def rename_file(path):
    buf = open(path).read()
    out = PATTERN.sub(lambda m: '--' + renamed(m.group(1)[2:]), buf)
    if out != buf:
        open(path, 'w').write(out)
        return True
    return False


def main():
    targets = sys.argv[1:] or [
        'fertig.css',
        'site.css',
        'index.html',
        'docs.html',
        'blocks.html',
        'llms.txt',
        'context7.json',
        'tools/sizes.py',
    ] + [os.path.join('templates', f) for f in os.listdir(os.path.join(ROOT, 'templates'))] \
      + [os.path.join('mockups', f) for f in os.listdir(os.path.join(ROOT, 'mockups'))]

    for rel in targets:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            print(f'  (skip) {rel}: not found')
            continue
        if rename_file(path):
            print(f'  {rel}: renamed')


if __name__ == '__main__':
    main()
