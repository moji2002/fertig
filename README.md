# fertig

[![Bundlephobia minified size](https://img.shields.io/bundlephobia/min/fertig?label=minified&cacheSeconds=86400)](https://bundlephobia.com/package/fertig)
[![Bundlephobia minified and compressed size](https://img.shields.io/bundlephobia/minzip/fertig?label=min%2Bgzip&cacheSeconds=86400)](https://bundlephobia.com/package/fertig)

A classless CSS file that gives you **components**, not just styled elements —
menus, dialogs, drawers, toasts and tooltips from plain semantic HTML,
built from native HTML and the ARIA that makes it accessible, and working with
JavaScript switched off.

Link it, write ordinary HTML, and the page is finished.

**36.7 KB raw · 8.6 KB gzipped · no build step · no dependencies · no JavaScript.**

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

`fertig.min.css` is 8.6 KB gzipped. That includes semantic element styling,
the component layer, responsive utilities, light and dark themes, RTL support
and accessibility safeguards. Size is a constraint here, not the pitch.

## Components that work without JavaScript

Audited in a browser with scripting disabled:

| | |
|---|---|
| Popover menu, dialog, drawer, toast, tooltip, disclosure | **work with no script** |
| Tabs | **styled only** — selection, panels and arrow keys need a short script |

This gap is deliberate: `aria-selected` must be a real attribute, inactive tabs
need roving focus, and CSS cannot implement the arrow-key contract. The complete
enhancement is in the docs. `<details name>` remains an exclusive accordion,
not a tabs substitute.

```html
<link rel="stylesheet" href="fertig.css">
```

That is the whole integration. Write semantic HTML; it looks finished.
Open the [live site](https://moji2002.github.io/fertig/) for the full demo.

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
| `--w` / `--g` | `--fertig-w` / `--fertig-g` |
| `--r` / `--rs` / `--rw` | `--fertig-r` / `--fertig-rs` / `--fertig-rw` |
| `--bg` / `--el` / `--face` / `--fg` / `--mut` / `--bd` / `--tb` | `--fertig-*` (same short name) |
| `--up` / `--up2` / `--dn` / `--sh` / `--sh1` / `--sh2` | `--fertig-up` / `--fertig-up2` / `--fertig-dn` / `--fertig-sh` / `--fertig-sh1` / `--fertig-sh2` |
| fonts `--f` / `--fm`, page width `--w`, gutter `--g`, caps `--caps`, `--nw` | `--fertig-*` |
| color ramps `--stone-*` / `--sage-*` / `--sky-*` / `--clay-*` / `--plum-*` / `--gold-*` | `--fertig-*` (same stop) |

The rule is simple: **any `--name` you set becomes `--fertig-name`.** Nothing
changed meaning; the prefix exists so the sheet never collides with a custom
property of yours (it is the same reason `--fertig-a1` / `--fertig-a2` were
already prefixed — those are `@property` registrations, which are global).

The defaults now favor a platform-neutral interface:

- **Palette.** Accents and neutrals moved to a cooler voice — graphite
  neutrals and a violet-blue accent — replacing the older indigo/warm scheme.
- **Geometry.** Buttons share the restrained control radius. Pill geometry is
  reserved for badges, switches, meters and joined ends.

The docs site was also rebuilt and the two demo pages (`app.html` /
`app-invoice.html`) are gone. None of that touches the sheet.

## Install

```sh
npm install fertig
```

```html
<!-- or from a CDN, pinned -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fertig@4/fertig.min.css">
```

```css
/* or through a bundler */
@import "fertig";
```

## What it is

Opinions, so you don't have to have them: system type, one accent, one page
width and a clear content canvas. The structure is classic — a toolbar,
sunken fields and flat buttons — while the finish stays platform-neutral:
opaque surfaces, hairlines, restrained corners and a violet-blue focus ring
over cool graphite neutrals.

- **System type, set properly** — 16px on a 1.65 line height. Long-form copy
  gets a roughly seventy-character measure with `.max-w-prose`. Code keeps a
  monospace face, where it earns its place.
- **A centered content canvas.** `<nav>` becomes a full-bleed opaque toolbar;
  `header`/`main`/`footer` form the page surface.
- **Depth from hairlines and soft shadows.** Cards sit above the page while
  buttons stay flat and inputs and code sit below it. Shadow alphas step up in dark mode,
  because a shadow on a dark background does nothing on its own.
- **Quiet text.** Links underline on hover rather than inverting mid-paragraph.
- **Comfortable foregrounds.** Light mode uses graphite rather than absolute
  black; dark mode uses a softened near-white rather than full white.
- **Dark mode with no second stylesheet.** One `light-dark()` token block.
  Add `data-theme="dark"` (or `"light"`) on `<html>` to override the OS.

## Layout

Direct children of `<body>` are the containers:

```html
<body>
  <nav>…</nav>       <!-- toolbar: full-bleed, contents on the page column -->
  <header>…</header>
  <main>…</main>
  <footer>…</footer>
</body>
```

The default page shell is `72rem`, roomy enough for application layouts and
documentation. Add `.max-w-prose` to long-form content for a readable `38rem`
line length, or `.wide` to a shell that genuinely needs the `80rem` column.
The `--fertig-g` gutter scales from `1.15rem` on narrow phones to `1.9rem` on
larger screens, and can be overridden independently of the shell width.

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

Addressed by semantic HTML and ARIA attributes, not by component classes — the
markup stays accessible by construction.

| Component | Markup |
|---|---|
| Segmented control | `<div role="group">` of buttons, `aria-pressed` |
| ARIA tabs | `<div role="tablist">`, `<button role="tab" aria-selected>`; switching and arrow keys need script |
| Switch | `<input type="checkbox" role="switch">` |
| Menu | any `[popover]` + `popovertarget` (anchored, no JS) |
| Breadcrumb | `<nav aria-label="Breadcrumb"><ol>` |
| Dialog | `<dialog>` — animates in; optional `<header>`/`<footer>` pin while the body scrolls |
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

## Layout utilities

A compact set of predictable layout helpers covers common flex, grid,
alignment, gap, margin, width and visibility needs.

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

The `max-w-*` scale is complete rather than partial — a half-scale where
`.max-w-2xl` works and `.max-w-3xl` silently does not is worse than no scale
at all. They are `max-inline-size`, so they still mean "along the text"
in a vertical writing mode, and they outrank the sheet's own measure on
`body > *`, so they retarget a page container as readily as anything inside
one. `.max-w-prose` is a fixed `38rem` reading measure, independent of the
`72rem` page shell.

## Customising

Override the tokens you'd actually want to change:

```css
:root {
  --fertig-ac: light-dark(var(--fertig-blue-700), var(--fertig-blue-300)); /* blue accent */
  --fertig-w: 48rem;                                              /* page shell width */
  --fertig-g: 1.25rem;                                            /* page gutter */
  --fertig-r: 0px;                                                /* control radius — go sharp */
  --fertig-f: "Inter", system-ui, sans-serif;                     /* text font */
}
```

The accent is the only colour most people touch. The default is blue sitting
on cool gray neutrals; the
`data-accent` attribute retints a whole region without touching tokens:

```html
<section data-accent="green">…</section>  <!-- or blue, cyan, amber, red, violet, gray -->
```

The palette exposes `gray`, `blue`, `cyan`, `green`, `amber`, `red` and
`violet` ramps at `100`, `300`, `500`, `700` and `900`. For example,
`--fertig-violet-500` is the middle violet stop. The former
`stone/sage/sky/clay/plum/gold` ramps and named accents were removed rather
than retained as aliases.

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
`--fertig-rw` the large-surface radius, and `--fertig-nw` the column the toolbar's
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
themes, calculated from the computed token values:

| Pair | Light | Dark |
|---|---:|---:|
| Body text on content surface | 16.83 | 15.32 |
| Muted text on content surface | 6.92 | 7.15 |
| Links on content surface | 6.72 | 9.50 |
| Muted on controls | 6.57 | 6.45 |
| Muted on page ground | 5.89 | 7.88 |
| Text on accent | 6.16 | 11.22 |
| Tones (ok / warn / err) | 5.91–7.17 | 9.12–10.76 |

The tightest pair in the sheet is text on the amber fill in light mode, at
5.41:1.

Motion is gated behind `prefers-reduced-motion`, focus uses a visible ring at
`:focus-visible`, and the component layer is driven by the same ARIA attributes
assistive technology reads.

## Size

| File | Raw | Gzip |
|---|---:|---:|
| **fertig.min.css** | **36.7 KB** | **8.6 KB** |

Measured with `gzip -9`; KB = 1024 bytes.

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
`contrast-color()` picks the light or dark text colour on your accent and a
small mix keeps it away from absolute black or white; anchor positioning
attaches popover menus to their button;
`::details-content` with `interpolate-size` animates disclosures open;
`field-sizing` grows textareas; `text-box: trim-both` sits headings on their
cap height; and
`appearance: base-select` styles the dropdown picker itself. Without any of it,
nothing breaks. Relative colour (`oklch(from …)`) is on that list too, for one
job only: lightening the filled button on hover in OKLCH. The shadow alphas
that used to need it are taken with `color-mix` against `transparent` instead —
pixel-identical, and three years older, which is what keeps Safari 17.5 inside
the floor. Two things are *not* on the list because they are part of the floor:
`@property`, which types the shadow alphas so elevation can transition, and
`container-type` on `.card`, which makes every card a container you can write
`@container` queries against.

It also answers to user and device preferences: `prefers-reduced-motion`,
`prefers-contrast`, `forced-colors`,
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
npm run hooks:install # enable the committed pre-commit hook in this clone
npm run check         # run the same complete gate manually
npm run build      # regenerate fertig.min.css and print sizes
npm run site       # build the site into dist/ with Eleventy
npm run site:serve # build + live-reload on :8080 (the Eleventy dev server)
npm run sizes      # sync the size claims in README + site copy
```

The pre-commit gate is read-only for tracked files. It rejects whitespace
errors, inconsistent release versions, stale minified CSS, stale size claims,
bundle-budget regressions, test failures, invalid site output and unexpected
package contents. If a generated file or size claim is stale, run the command
named by the failure, review the diff, and commit it deliberately.
Tracked changes must be fully staged, preventing an unstaged fix from hiding a
broken staged snapshot during validation.

## Builds

| Build | Raw | Gzip | |
|---|---:|---:|---|
| `fertig.min.css` | 36.7 KB | 8.6 KB | everything |

## Files

The sheet:

- `fertig.css` — source, commented
- `fertig.min.css` — minified, what you ship
- `build.js` — minifier and size report

The site (Eleventy, output to `dist/`):

- `src/_includes/layout.njk` — shared document shell and navigation
- `src/_includes/{page-header,footer}.njk` — shared inner-page header and footer
- `src/_data/site.js` — version pulled from `package.json` (the one source of truth)
- `src/{index,docs,components,blocks}.njk` — the only authored page sources
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
