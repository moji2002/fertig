# fertig

A classless CSS file that gives you **components**, not just styled elements —
menus, dialogs, drawers, toasts and tooltips from plain semantic HTML,
addressed by the ARIA that makes them accessible, and working with JavaScript
switched off.

Link it, write ordinary HTML, and the page is finished.

**36.8 KB raw · 8.8 KB gzipped · no build step · no dependencies · no JavaScript.**

### What makes it different

Surveyed across the eleven most-used classless stylesheets on 2026-08-31
([working notes](docs/classless-landscape-2026.md)):

- **Components addressed by ARIA.** Only one other classless sheet ships a
  single ARIA-addressed component. None ships tabs, a segmented control, or an
  anchored popover menu.
- **Behaviour without JavaScript.** Others style `<dialog>` and leave the open
  and close to you. Here `popover`, `command` and anchor positioning do it —
  [audited with scripting disabled](#components-that-work-without-javascript).
- **Modern CSS.** Zero of the eleven use `oklch()`, `light-dark()`, `@layer`,
  `@property`, container queries or anchor positioning. This sheet uses all of
  them.
- **Cascade-layered.** It lives in `@layer fertig`, so your own unlayered CSS
  wins at any specificity and overriding never needs `!important`. No other
  classless sheet does this.
- **RTL by construction.** Written in logical properties throughout, not
  patched with `[dir=rtl]` overrides afterwards.

It is *not* the smallest — Concrete.css is 1.2 KB gzipped, and most of the
field is a fraction of this because it styles elements and stops there. Against
the two classless sheets that also ship a component layer, fertig is the
lightest: 8.8 KB against matcha's 8.8 KB and Pico classless at 10.2 KB, and the
only one of the three whose components work without JavaScript. Size is a
constraint here, not the pitch.

## Components that work without JavaScript

Audited in a browser with scripting disabled:

| | |
|---|---|
| Popover menu, dialog, drawer, toast, tooltip, disclosure | **work with no script** |
| Tabs | **styled only** — switching panels needs ~8 lines of your own |

Tabs are the one gap, and it is deliberate: `aria-selected` must be a real
attribute for a screen reader to announce the right tab, and CSS cannot set
attributes. The snippet is in the docs.

```html
<link rel="stylesheet" href="fertig.css">
```

That is the whole integration. Write semantic HTML; it looks finished.
Open `index.html` for the full demo.

## Upgrading from 2.x

3.0 is breaking for one reason: **every public token now carries a `--fertig-`
prefix**, and the old names are gone — no aliases. The classes, the ARIA
attributes the components read, and the layout utilities are all unchanged.
The sheet's behaviour is the same; the migration is a rename.

If you override tokens, prefix what you set. The common ones:

| 2.x | 3.0 |
|---|---|
| `--ac` | `--fertig-ac` |
| `--on-ac` | `--fertig-on-ac` |
| `--w` | `--fertig-w` |
| `--r` / `--rs` / `--rw` | `--fertig-r` / `--fertig-rs` / `--fertig-rw` |
| `--bg` / `--el` / `--face` / `--fg` / `--mut` / `--bd` / `--tb` | `--fertig-*` (same short name) |
| `--up` / `--up2` / `--dn` / `--sh` / `--sh1` / `--sh2` | `--fertig-up` / `--fertig-up2` / `--fertig-dn` / `--fertig-sh1` / `--fertig-sh{2}` |
| fonts `--f` / `--fm`, measure `--w`, caps `--caps`, `--nw` | `--fertig-*` |
| color ramps `--stone-*` / `--sage-*` / `--sky-*` / `--clay-*` / `--plum-*` / `--gold-*` | `--fertig-*` (same stop) |

The rule is simple: **any `--name` you set becomes `--fertig-name`.** Nothing
changed meaning; the prefix exists so the sheet never collides with a custom
property of yours (it is the same reason `--fertig-a1` / `--fertig-a2` were
already prefixed — those are `@property` registrations, which are global).

Two defaults change visually, so pin `fertig@2` if you want the old look:

- **Palette.** Accents and neutrals moved to a cooler voice — graphite
  neutrals and a violet-blue accent — replacing the older indigo/warm scheme.
- **Buttons.** Fully rounded (`border-radius: 999px`) instead of the moderate
  radius.

The docs site was also rebuilt and the two demo pages (`app.html` /
`app-invoice.html`) are gone. None of that touches the sheet.

## Install

```sh
npm install fertig
```

```html
<!-- or from a CDN, pinned -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fertig@3/fertig.min.css">
```

```css
/* or through a bundler */
@import "fertig";
```

## What it is

Opinions, so you don't have to have them: system type, one accent, one
measure, a window on a desktop. The structure is classic — a title bar, sunken
fields, raised buttons — and the finish is macOS: vibrancy, hairlines, soft
radii, a violet-blue focus ring over cool graphite neutrals. None of it is a
period costume, and none of it is a picture of an OS: it is all CSS that every
current engine already ships.

- **System type, set properly** — 16px on a 1.65 line height across roughly
  seventy characters. Code keeps a monospace face, where it earns its place.
- **A window on a desktop.** `<nav>` becomes a full-bleed toolbar with a
  vibrancy blur; `header`/`main`/`footer` are the paper.
- **Depth from hairlines and soft shadows.** Buttons and cards sit above the
  page, inputs and code sit below it. Shadow alphas step up in dark mode,
  because a shadow on a dark background does nothing on its own.
- **Quiet text.** Links underline on hover rather than inverting mid-paragraph.
- **Dark mode with no second stylesheet.** One `light-dark()` token block.
  Add `data-theme="dark"` (or `"light"`) on `<html>` to override the OS.

## Layout

Direct children of `<body>` are the containers:

```html
<body>
  <nav>…</nav>       <!-- toolbar: full-bleed, contents on the measure -->
  <header>…</header>
  <main>…</main>
  <footer>…</footer>
</body>
```

One wrapper is fine. React, Vue, Svelte and Next render into a mount node, so
the shell matches `body`'s children *or* the children of a single `#root`,
`#app`, `#__next`, or `[data-fertig]` wrapper:

```html
<body>
  <div id="root">
    <nav>…</nav>
    <main>…</main>
  </div>
</body>
```

Deeper than that, or a differently named mount node, and you re-point the shell
yourself — it is the only place `body >` appears:

```css
#shell > *, #shell > header, #shell > main, #shell > footer { /* … */ }
```

## Components

Addressed by ARIA attributes, not by class — the markup stays semantic and
accessible by construction.

| Component | Markup |
|---|---|
| Segmented control | `<div role="group">` of buttons, `aria-pressed` |
| Tabs | `<div role="tablist">`, `<button role="tab" aria-selected>` |
| Switch | `<input type="checkbox" role="switch">` |
| Menu | any `[popover]` + `popovertarget` (anchored, no JS) |
| Breadcrumb | `<nav aria-label="Breadcrumb"><ol>` |
| Dialog | `<dialog>` — animates in, blurs the page behind; optional `<header>`/`<footer>` pin while the body scrolls |
| Loading | `aria-busy="true"` (inline spinner) |
| Tooltip | `data-tooltip="…"` — decorative; put the same words in `aria-label` too |
| Button variants | `data-variant="ghost\|link"`, `data-size="sm\|lg"`, `data-icon`, `data-block` — on controls only, so they cannot catch a `<span data-size>` of yours |
| Card anatomy | `<header>` / `<footer>` inside `.card`; `<a class="card">` lifts on hover |
| Tones | `data-tone="ok\|warn\|err"` retints any component |

And a second set, added for parity with the component libraries — same rule,
no classes:

| Component | Markup |
|---|---|
| Avatar | `data-avatar` on an `<img>` or on initials in a `<span>`; `="sm\|lg"` |
| Skeleton | `data-skeleton` on the element that is still loading |
| Sheet / drawer | `<dialog data-side="left\|right\|bottom">` — the same dialog, docked to an edge |
| Toast | `[popover][data-toast]` — non-modal, parked in a corner. Several at once: `<div popover="manual" data-toast-region>` with a `<div data-toast>` per message |
| List group | a plain `<menu>` outside a popover becomes a bordered list |
| Nav menu | a `<menu>` inside a `<nav>` is navigation instead — no rules, no bullets, `aria-current` marks the page |
| Sidebar layout | `data-layout="sidebar"` on a wrapper of two children; the first sticks |
| Carousel | `data-carousel` — scroll snapping, with real scroll buttons where they exist |

## The seven optional classes

`.row` `.grid` `.card` `.badge` `.muted` `.center` `.wide`

Plus `.primary` on a button — though `type="submit"` already gets it.

## Layout utilities, borrowed from Tailwind

The names are Tailwind's on purpose: if you know them there they mean the same
thing here, so nothing new has to be learned.

```
.flex  .flex-col  .flex-wrap  .flex-1
.grid-cols-2  .grid-cols-3  .grid-cols-4
.items-start  .items-center  .items-end
.justify-start  .justify-center  .justify-end  .justify-between
.gap-0  .gap-1  .gap-2  .gap-3  .gap-4  .gap-6      (0 · .25 · .5 · .75 · 1 · 1.5rem)
.mx-auto  .ms-auto  .me-auto  .w-full  .hidden
.max-w-xs .max-w-sm .max-w-md .max-w-lg .max-w-xl            (20 · 24 · 28 · 32 · 36rem)
.max-w-2xl .max-w-3xl .max-w-4xl .max-w-5xl .max-w-6xl .max-w-7xl  (42 · 48 · 56 · 64 · 72 · 80rem)
.max-w-full  .max-w-none  .max-w-prose
```

Layout and width only. No colour or type scale, and no responsive
variants — those need a build step, and this file does not have one. The
margins are flow-relative (`ms`/`me`, not `ml`/`mr`), so a toolbar still lands
correctly in Persian or Arabic. `.grid` is fertig's own auto-fit grid;
adding `.grid-cols-3` pins it to three columns.

The `max-w-*` scale is Tailwind's, whole rather than partial — a half-scale
where `.max-w-2xl` works and `.max-w-3xl` silently does not is worse than no
scale at all. They are `max-inline-size`, so they still mean "along the text"
in a vertical writing mode, and they outrank the sheet's own measure on
`body > *`, so they retarget a page container as readily as anything inside
one. `.max-w-prose` is that measure, as a class.

## Customising

Override the tokens you'd actually want to change:

```css
:root {
  --fertig-ac: light-dark(oklch(50% .22 266), oklch(78% .13 266)); /* violet-blue accent */
  --fertig-w: 48rem;                                              /* measure */
  --fertig-r: 0px;                                                /* control radius — go sharp */
  --fertig-f: "Inter", system-ui, sans-serif;                     /* text font */
}
```

The accent is the only colour most people touch. In 3.0 the default is a
violet-blue (`hue 266`) sitting on cool graphite neutrals (`hue 258`); the
`data-accent` attribute retints a whole region without touching tokens:

```html
<section data-accent="sage">…</section>  <!-- or sky, clay, plum, gold, slate -->
```

Tones work the same way — `data-tone="ok|warn|err"` retints any component
without a round trip through the tokens:

```html
<button data-tone="err">Delete</button>
```

If you change `--fertig-ac`, check `--fertig-on-ac` too — that is the text
colour sitting on the accent, and a light accent needs dark text to stay
legible. `--fertig-up` / `--fertig-up2` / `--fertig-dn` are the elevation
scale, `--fertig-a1` / `--fertig-a2` the shadow alphas (these two are
`@property` registrations, and a registration is global — hence the prefix),
`--fertig-rw` the window radius, and `--fertig-nw` the column the toolbar's
contents line up with. `--fertig-nw` follows `--fertig-w`, so nothing moves by
default; `<nav class="wide">` re-points it at the wide column, which is what an
app screen built on `.wide` wants so its wordmark doesn't float in the middle
of the viewport.

## Also handled

`:target`, external-link arrows, `user-invalid` fields, a CSS-drawn select
chevron, thin scrollbars, `sup`/`sub` that don't stretch lines, `q`/`dfn`/
`ins`/`del`/`address`/`meter`/`output`/`optgroup`/`hgroup`, print styles, and
`prefers-reduced-motion`.

## Right-to-left

Every inline-direction rule is flow-relative — `padding-inline-start`,
`border-inline-start`, `margin-inline-end`, `text-align: start`,
`border-start-end-radius` — so `dir="rtl"` mirrors the sheet with nothing to
configure:

```html
<html lang="fa" dir="rtl">
```

List markers, blockquote and `<aside>` accent bars, table gutters, breadcrumb
separators, the segmented control's rounded ends, the `<select>` chevron and
the switch knob all move to the correct side. Two of those cannot be expressed
logically — `translate` and a background position — and carry `:dir(rtl)`
rules instead. The layout utilities follow the same rule: `.ms-auto` and
`.me-auto` exist, `.ml-auto` deliberately does not.

Tested by rendering a Persian page in both directions, not by inspection.

## Accessibility

Every foreground/background pair meets WCAG 2.1 AA (>= 4.5:1) in **both**
themes, measured in-browser from the computed token values:

| Pair | Light | Dark |
|---|---:|---:|
| Body text on paper | 17.05 | 15.31 |
| Muted text on paper | 6.73 | 7.41 |
| Links on paper | 6.38 | 8.97 |
| Muted on chrome | 6.30 | 6.70 |
| Muted on the desktop ground | 5.65 | 8.11 |
| Text on accent | 6.48 | 10.63 |
| Tones (ok / warn / err) | 4.80–6.55 | 7.63–9.43 |

The tightest pair in the sheet is the warn tone on paper in light, at 4.80:1.

Motion is gated behind `prefers-reduced-motion`, focus uses a visible ring at
`:focus-visible`, and the component layer is driven by the same ARIA attributes
assistive technology reads.

## Size

| Sheet | Raw | Gzip |
|---|---:|---:|
| **fertig** | **36.8 KB** | **8.8 KB** |
| Pico 2.1.1 classless | 69.4 KB | 10.1 KB |

Measured with `gzip -9`, KB = 1024 bytes for every row. Most of the gap is Pico's full
colour palette and its base64-SVG control icons; see
`docs/classless-css-research.md`.

## Overriding it

The sheet declares two layers, `@layer fertig, fertig-a11y` — the second holds
the forced-colors block so it can beat a `.card` shadow on layer order instead
of `!important`. Anything you write outside a layer beats both whatever the
specificity, so overriding is never a fight:

```css
button { background: hotpink }   /* wins, no !important needed */
```

## Modern CSS, used deliberately

Everything past the floor sits behind `@supports` and is additive:
`contrast-color()` picks the text colour on your accent so an override cannot
fail contrast; anchor positioning attaches popover menus to their button;
`::details-content` with `interpolate-size` animates disclosures open;
`field-sizing` grows textareas; `corner-shape: squircle` gives continuous
corners; `text-box: trim-both` sits headings on their cap height; and
`appearance: base-select` styles the dropdown picker itself. Without any of it,
nothing breaks. Relative colour (`oklch(from …)`) is on that list too, for one
job only: lightening the filled button on hover in OKLCH. The shadow alphas
that used to need it are taken with `color-mix` against `transparent` instead —
pixel-identical, and three years older, which is what keeps Safari 17.5 inside
the floor. Two things are *not* on the list because they are part of the floor:
`@property`, which types the shadow alphas so elevation can transition, and
`container-type` on `.card`, which makes every card a container you can write
`@container` queries against.

It also answers to the OS: `prefers-reduced-motion`,
`prefers-reduced-transparency`, `prefers-contrast`, `forced-colors`,
`pointer: coarse` (44px targets, WCAG 2.5.8), `env(safe-area-inset-*)`,
`update: fast` (e-ink never starts a transition), `inverted-colors` and
`color-gamut: p3`.

And it survives content it has never seen: a pasted URL wraps instead of
widening the page, tables scroll themselves on a phone, autofilled fields are
repainted so the browser yellow never shows, required and read-only fields
read correctly, numerals are slashed and tabular, and print gets real page
margins with no stranded lines.

## Browser support

The two-year window is on *browsers*, not on CSS. fertig runs in anything
released since August 2024. The CSS it uses is mostly older than that:
`@layer` has been cross-engine since 2022, `oklch()` and `color-mix()` since
2023, `light-dark()` since May 2024. The newest thing it *requires* is
`@starting-style`, cross-engine since August 2024 — nothing it needs shipped
inside the last two years.

It carries almost nothing for the browsers before that: no polyfills, no
fallback build, and no vendor prefixes beyond the three no engine has replaced
(`-webkit-text-size-adjust`, the `-webkit-text-fill-color` autofill repaint,
and the `progress` pseudo-elements). The one concession is a `@supports not
(color: light-dark(…))` block restating the palette in flat sRGB — without it
an engine that lacks `light-dark()` gets invalid colour tokens and lands
unreadable rather than plain.

| Engine | Minimum | Set by |
|---|---|---|
| Chrome / Edge | **123** | `light-dark()` |
| Safari | **17.5** | `light-dark()`, `@starting-style`, `text-wrap: balance` |
| Firefox | **129** | `@starting-style`, `transition-behavior` |

No component needs more than that floor — anything a component would *like* to
have it asks for through `@supports`. Anchor positioning, for instance, is
gated; without it `[popover]` menus centre on screen instead of sitting under
their button. Below the floor everything degrades to unstyled-but-readable
HTML.

Per-component and per-enhancement version tables, with the shipping dates
behind them, are in [`docs/browser-support-research.md`](docs/browser-support-research.md)
and on the [docs site](https://moji2002.github.io/fertig/docs.html#support).

## Development

```sh
npm run build      # regenerate fertig.min.css and print sizes
npm run site       # build the site into dist/ with Eleventy
npm run site:serve # build + live-reload on :8080 (the Eleventy dev server)
npm run sizes      # sync the size claims in README + site copy
```

## Builds

| Build | Raw | Gzip | |
|---|---:|---:|---|
| `fertig.min.css` | 36.8 KB | 8.8 KB | everything |

## Files

The sheet:

- `fertig.css` — source, commented
- `fertig.min.css` — minified, what you ship
- `build.js` — minifier and size report

The site (Eleventy, output to `dist/`):

- `src/_includes/layout.njk` — shared head + nav
- `src/_data/site.js` — version pulled from `package.json` (the one source of truth)
- `src/{index,docs,blocks}.njk` — page templates, generated from the root
  HTML by `tools/build-src.py`
- `index.html`, `docs.html`, `blocks.html` — the authored source for each page
  (the live customiser on the landing page writes the token block for you)
- `site.css`, `site.js`, `icons.svg`, `favicon.svg` — the site's own chrome,
  none of it part of the sheet
- `dist/` — the built site that GitHub Pages deploys

Everything else:

- `llms.txt` — machine-readable summary for LLMs, per llmstxt.org
- `CHANGELOG.md` — what changed and why, per release
- `docs/classless-css-research.md` — the research behind the decisions

The sheet itself ships without the site — the npm package holds the two CSS
files plus the README and licence, nothing else.

## License

MIT © Mojtaba Beheshti
