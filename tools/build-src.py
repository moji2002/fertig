#!/usr/bin/env python3
"""Migrate the hand-written marketing pages into Eleventy templates.

Draws the shared <head> + <nav> out into src/_includes/layout.njk (already
written by hand) and keeps each page's body verbatim as the template content,
prefixed with front matter driving that shared chrome: title, description, the
active nav link, extra highlight.js languages, and the JSON-LD schema.

The body is spliced, never retyped, so the rendered page stays byte-identical
in everything but the extracted chrome — which is the whole point: one shared
source for head + nav, and the version flowing from package.json.
"""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

# project version drives the hero pill + footer + schema softwareVersion
import json as _json
VERSION = _json.load(open(os.path.join(ROOT, 'package.json')))['version']

# The title/description/OG strings live in the root HTML's own <title> and
# <meta> tags — read here, never retyped — so tools/sizes.py (which edits those
# tags) flows straight through to the built templates. Only the fields a plain
# <meta> tag can't express live in this dict: nav state, URL suffix, languages,
# and the JSON-LD schema.
PAGES = {
    'index': {
        'file': 'index.html',
        'canonical': '',
        'active': 'index',
        'permalink': 'index.html',
        'langs': ['bash'],
        'schema': {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'fertig',
            'applicationCategory': 'DeveloperApplication',
            'description': 'A classless CSS framework built only on CSS that every current engine already ships. Semantic HTML in, a designed page out, with no JavaScript and no build step.',
            'url': 'https://moji2002.github.io/fertig/',
            'downloadUrl': 'https://www.npmjs.com/package/fertig',
            'codeRepository': 'https://github.com/moji2002/fertig',
            'softwareVersion': VERSION,
            'operatingSystem': 'Any',
            'license': 'https://opensource.org/licenses/MIT',
            'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
        },
    },
    'docs': {
        'file': 'docs.html',
        'canonical': 'docs.html',
        'active': 'docs',
        'permalink': 'docs.html',
        'langs': ['javascript', 'bash'],
    },
    'blocks': {
        'file': 'blocks.html',
        'canonical': 'blocks.html',
        'active': 'blocks',
        'permalink': 'blocks.html',
        'langs': ['javascript', 'bash'],
    },
}


def meta_of(html):
    """Pull the authored title + description + OG fields out of the source
    HTML rather than duplicating them here. Keeps build-src and the root page
    from ever disagreeing about copy."""
    m = re.search(r'<title>(.*?)</title>', html, re.S)
    title = m.group(1).strip() if m else ''
    desc = None
    og_title, og_desc, og_alt = None, None, None
    for prop, attr in [('description', 'name'), ('og:title', 'property'),
                       ('og:description', 'property'), ('og:image:alt', 'property')]:
        m = re.search(
            rf'<meta {attr}="{re.escape(prop)}" content="(.*?)"', html)
        if not m:
            m = re.search(
                rf'<meta content="(.*?)" {attr}="{re.escape(prop)}"', html)
        if m:
            val = m.group(1)
            if prop == 'description':
                desc = val
            elif prop == 'og:title':
                og_title = val
            elif prop == 'og:description':
                og_desc = val
            else:
                og_alt = val
    return title, desc, og_title, og_desc, og_alt


def body_of(html):
    # everything after the first (site) nav and before the closing </html>;
    # some pages are hand-authored without a closing </html>, so handle both.
    start = html.index('</nav>') + len('</nav>')
    end = html.rindex('</html>') if '</html>' in html else len(html)
    return html[start:end].rstrip('\n')


def render_front(meta):
    # JSON-encoded scalars are valid YAML, so any value — with ":", ",", or
    # quotes — survives front matter parsing without escaping gymnastics.
    def q(s):
        return _json.dumps(str(s))
    prefix = ['---']
    prefix.append(f'layout: layout.njk')
    prefix.append(f'permalink: {q(meta["permalink"])}')
    prefix.append(f'title: {q(meta["title"])}')
    if meta.get('description'):
        prefix.append(f'description: {q(meta["description"])}')
    if meta.get('ogTitle'):
        prefix.append(f'ogTitle: {q(meta["ogTitle"])}')
    if meta.get('ogDescription'):
        prefix.append(f'ogDescription: {q(meta["ogDescription"])}')
    if meta.get('ogImageAlt'):
        prefix.append(f'ogImageAlt: {q(meta["ogImageAlt"])}')
    if 'canonical' in meta:
        prefix.append(f'canonical: {q(meta["canonical"])}')
    prefix.append(f'active: {meta["active"]}')
    if meta.get('langs'):
        prefix.append('langs:')
        for lang in meta['langs']:
            prefix.append(f'  - {lang}')
    if meta.get('schema'):
        rendered = _json.dumps(meta['schema'], indent=2)
        # YAML block scalar for the ld+json document
        prefix.append('schema: |')
        for line in rendered.split('\n'):
            prefix.append('  ' + line)
    prefix.append('---')
    return '\n'.join(prefix)


for name, meta in PAGES.items():
    html = open(os.path.join(ROOT, meta['file'])).read()
    title, desc, og_title, og_desc, og_alt = meta_of(html)
    meta['title'] = title
    meta['description'] = desc
    meta['ogTitle'] = og_title
    meta['ogDescription'] = og_desc
    meta['ogImageAlt'] = og_alt
    body = body_of(html)
    out = render_front(meta) + '\n' + body + '\n'
    dest = os.path.join(SRC, f'{name}.njk')
    open(dest, 'w').write(out)
    print(f'  wrote {os.path.relpath(dest, ROOT)} ({len(body.splitlines())} body lines)')

# patch the version string in each generated template so it uses the data
for name in PAGES:
    dest = os.path.join(SRC, f'{name}.njk')
    buf = open(dest).read()
    buf = buf.replace(f'v{VERSION} — modern defaults', 'v{{ site.version }} — modern defaults')
    buf = buf.replace(f'<span>v{VERSION}</span>', '<span>v{{ site.version }}</span>')
    open(dest, 'w').write(buf)
print('\nversion references wired to {{ site.version }}')
