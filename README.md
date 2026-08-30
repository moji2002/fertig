# fertig

A classless CSS file for developers who want a project to look presentable in
the ten seconds before they start building it. Link it, write ordinary HTML,
and the page is finished.

**28.7 KB raw · 7.8 KB gzipped · no build step · no dependencies · no JavaScript.**

```html
<link rel="stylesheet" href="fertig.css">
```

That is the whole integration. Write semantic HTML; it looks finished.
Open `index.html` for the full demo.

## Install

```sh
npm install fertig
```

```html
<!-- or from a CDN, pinned -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fertig@1/fertig.min.css">
```

```css
/* or through a bundler */
@import "fertig";
```

## What it is

Opinions, so you don't have to have them: system type, one accent, one
measure, a window on a desktop. The structure is classic — a title bar, sunken
fields, raised buttons — and the finish is macOS: vibrancy, hairlines, soft
radii, the blue focus ring. None of it is a period costume, and none of it is
a picture of an OS: it is all CSS that shipped in the last two years.

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

Using a framework where `body` is not the semantic parent? Re-point the four
container rules at your root element (`#root`, `#__next`) — they are the only
place `body >` appears.

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
| Tooltip | `data-tooltip="…"` |
| Button variants | `data-variant="ghost\|link"`, `data-size="sm\|lg"`, `data-icon`, `data-block` |
| Card anatomy | `<header>` / `<footer>` inside `.card`; `<a class="card">` lifts on hover |
| Tones | `data-tone="ok\|warn\|err"` retints any component |

And a second set, added for parity with the component libraries — same rule,
no classes:

| Component | Markup |
|---|---|
| Avatar | `data-avatar` on an `<img>` or on initials in a `<span>`; `="sm\|lg"` |
| Skeleton | `data-skeleton` on the element that is still loading |
| Sheet / drawer | `<dialog data-side="left\|right\|bottom">` — the same dialog, docked to an edge |
| Toast | `[popover][data-toast]` — non-modal, parked in a corner |
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

Override the four tokens you'd actually want to change:

```css
:root {
  --ac: light-dark(#c2410c, #fb923c);  /* accent */
  --w: 48rem;                          /* measure */
  --r: 0px;                            /* control radius — go sharp */
  --f: "Inter", system-ui, sans-serif; /* text font */
}
```

If you change `--ac`, check `--on-ac` too — that is the text colour sitting on
the accent, and a light accent needs dark text to stay legible.
`--up` / `--up2` / `--dn` are the elevation scale, `--a1` / `--a2` the shadow
alphas, `--rw` the window radius, and `--nw` the column the toolbar's contents
line up with. `--nw` follows `--w`, so nothing moves by default; `<nav
class="wide">` re-points it at the wide column, which is what an app screen
built on `.wide` wants so its wordmark doesn't float in the middle of the
viewport.

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
| **fertig** | **28.7 KB** | **7.8 KB** |
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

Everything past the baseline sits behind `@supports` and is additive:
`contrast-color()` picks the text colour on your accent so an override cannot
fail contrast; anchor positioning attaches popover menus to their button;
`::details-content` with `interpolate-size` animates disclosures open;
`field-sizing` grows textareas; `corner-shape: squircle` gives continuous
corners; `text-box: trim-both` sits headings on their cap height; and
`@property` types the shadow alphas so elevation can transition;
`appearance: base-select` styles the dropdown picker itself; and `.card` is a
container you can write `@container` queries against. Without any of it,
nothing breaks. Relative colour (`oklch(from …)`) is not in that list — it is
baseline here, deriving both the shadow ink and the filled-button hover.

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

The policy is a two-year window: fertig targets browsers released in the last
two years and carries nothing for the ones before them — no vendor prefixes, no
polyfills, no fallback build. Needs `light-dark()`, `color-mix()`, `:has()`,
`@starting-style` and relative colour — Chrome 125+, Safari 17.5+,
Firefox 129+. Anchor positioning is
Chromium-only for now and is wrapped in `@supports`; without it, `[popover]`
menus centre on screen instead of sitting under their button. Everything else
degrades to unstyled-but-readable HTML.

## Development

```sh
npm run dev      # serve on :8899
npm run build    # regenerate fertig.min.css and print sizes
```

## Builds

| Build | Raw | Gzip | |
|---|---:|---:|---|
| `fertig.min.css` | 28.7 KB | 7.8 KB | everything |
| `fertig.core.min.css` | 21.8 KB | 6.3 KB | without the ARIA component layer |

Dropping the component layer saves 1.4 KB gzipped — worth knowing, rarely worth
doing. The weight is in the element coverage and forms, not the components.

## Files

The sheet:

- `fertig.css` — source, commented
- `fertig.min.css` — minified, what you ship
- `fertig.core.min.css` — the same without the ARIA component layer
- `build.js` — minifier and size report

The site:

- `index.html` — landing page, with a live customiser that writes the token
  block for you
- `docs.html` — documentation
- `blocks.html` — ready-to-use markup blocks (16 of them); the code shown is
  generated from the live preview, so it cannot drift
- `app.html`, `app-invoice.html` — full product screens built with no page CSS
  at all
- `templates/` — four whole pages: `dashboard`, `article`, `pricing`, `signin`
- `site.css`, `site.js`, `icons.svg`, `favicon.svg` — the site's own chrome,
  none of it part of the sheet

Everything else:

- `llms.txt` — machine-readable summary for LLMs, per llmstxt.org
- `CHANGELOG.md` — what changed and why, per release
- `docs/classless-css-research.md` — the research behind the decisions

## License

MIT © Mojtaba Beheshti
