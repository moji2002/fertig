# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The public surface
is the token names, the class names (the seven, plus the layout utilities),
and the ARIA attributes the component layer reads — changes to any of those
are breaking.

## Unreleased

## [4.0.3] — 2026-09-01

### Fixed

- **Disabled filled buttons look disabled.** Primary and submit controls now
  return to the quiet control surface with muted text instead of retaining the
  enabled accent fill.
- **Every published tab example is a real tab widget.** Examples now pair each
  tab with a labelled panel, keep only the active tab in the Tab sequence and
  support Left, Right, Home and End keys through one shared controller.

## [4.0.2] — 2026-09-01

### Changed

- **Body-level page containers are full width by default.** fertig keeps the
  responsive page gutter but no longer applies a maximum width to direct body
  children or supported app-root children. Explicit `max-w-*`
  utilities remain available when a page needs a constrained measure.

## [4.0.1] — 2026-09-01

### Changed

- **Buttons are flat and stay put.** The raised shadow, filled-button highlight
  and active press nudge are gone. Hover contrast, focus-visible outlines,
  disabled feedback and coarse-pointer target sizing remain intact.
- **The public documentation speaks only about fertig.** Comparative product
  names, size rankings and survey links were removed from every published page.

### Fixed

- **Shared mobile controls now have reliable touch targets.** Navigation,
  theme, colour, catalogue filter and sidebar controls reach 44 by 44 pixels;
  catalogue filters stay in one horizontal row instead of building a tall
  stack on narrow screens.
- **Theme and copy feedback are clearer.** The theme control names its target,
  while clipboard fallbacks select the text and use platform-neutral wording.

## [4.0.0] — 2026-09-01

### Changed

- **The palette is new and intentionally direct.** `gray`, `blue`, `cyan`,
  `green`, `amber`, `red` and `violet` replace the former
  `stone/sage/sky/clay/plum/gold` ramps. Each ships at 100/300/500/700/900,
  stays inside sRGB and uses a consistent OKLCH progression. Blue is the new
  default accent; `ok`, `warn` and `err` now map directly to green, amber and
  red.
- **The default finish is platform-neutral.** Opaque toolbar and surface
  colors, restrained 8px control geometry, ordinary rounded buttons and generic
  system font fallbacks replace the OS-specific translucent treatment. The
  optional squircle enhancement and decorative backdrop blur are gone.
- **The default hierarchy is clearer and the page gutter is responsive.**
  `h1` and `h2` now use a restrained fluid type scale, while the new
  `--fertig-g` token grows from 1.15rem on narrow phones to 1.9rem on larger
  screens. Desktop density is unchanged; small screens recover useful space.
- **The generic toolbar stays composed on phones.** A navigation list gets one
  horizontally scrollable row beneath the identity and trailing control instead
  of wrapping around them in an uneven cluster.

### Removed

- **The former palette and named accents.** Old ramp tokens and
  `data-accent="indigo|sky|sage|clay|plum|gold|slate"` are not retained as
  aliases. Use `data-accent="blue|cyan|green|amber|red|violet|gray"`.
- **Legacy mockup pages and static social-preview screenshots.** The site build
  no longer copies them or emits metadata pointing at deleted preview images.

### Fixed

- **Responsive tables scroll before their cells become unreadable.** Below
  40rem, cell content keeps its intrinsic width inside the existing table scroll
  container instead of wrapping almost word-by-word.
- **Size synchronization cannot rewrite third-party measurements.** Published
  claims are now an explicit manifest of fertig-specific contexts. A changed or
  missing context fails the command, and a regression test protects unrelated
  values that happen to match fertig's previous size.

## [3.1.0] — 2026-09-01

### Changed

- **The 72rem default is now a page shell, not a prose measure.**
  `.max-w-prose` keeps long-form copy at 38rem, while `.wide` provides an 80rem
  application column. The documentation and customiser now use the same
  defaults and terminology as the stylesheet.
- **The documentation toolbar stays compact on phones.** Its primary controls
  occupy the first row and its links scroll horizontally on the second instead
  of wrapping into a tall stack. The Components page is now present in the
  shared navigation.

### Fixed

- **The minified build preserves descendant selectors.** The old punctuation
  regex changed selectors such as `nav :is(…)` into `nav:is(…)`, silently
  breaking row controls and popover menus. The minifier now understands CSS
  strings and comments, with focused regression tests for both failure modes.
- **Reduced-transparency preferences reach framework wrappers.** A toolbar
  inside `#root`, `#app`, `#__next` or `[data-fertig]` now drops its backdrop
  blur just like a toolbar that is a direct child of `body`.

## [3.0.0] — 2026-08-31

The breaking change is one mechanical line: **every public token now carries a
`--fertig-` prefix, and the old names are gone** — no aliases, no shims. The
classes, the layout utilities and the ARIA attributes the component layer reads
are all untouched. The sheet does exactly what it did; the migration is a
rename.

`--fertig-a1` / `--fertig-a2` already carried the prefix for the reason the rest
receive it now: a short, unprefixed custom property is a bet you only lose
once. `--ac` collided with your own `--ac`; the prefix makes every token yours
to override, and no future rename is ever needed again.

**To migrate:** prefix whatever you override. `--w` → `--fertig-w`,
`--ac` / `--on-ac` → `--fertig-ac` / `--fertig-on-ac`, the radii
`--r` / `--rs` / `--rw` → `--fertig-*`, the surfaces (`--bg`, `--el`, `--face`,
`--fg`, `--mut`, `--bd`, `--tb`, `--nw`), the depth tokens (`--up`, `--up2`,
`--dn`, `--sh`, `--sh1`, `--sh2`, and the `@property` alphas `--a1` / `--a2`),
the motion tokens (`--ease`, `--ease-in`, `--ease-out`, `--dur-1`, `--dur-2`),
`--caps`, and the colour ramps (`--stone-*`, `--sage-*`, `--sky-*`, `--clay-*`,
`--plum-*`, `--gold-*`). The rule is one line: **any `--name` you set becomes
`--fertig-name`.** Nothing changed meaning.

### Changed

- **The palette moves to a cooler voice.** Neutrals are a cool graphite
  (hue ≈ 258) with a faint violet cast, replacing the warm stone; the accent is
  a violet-blue (hue 266), replacing indigo. Measured: the accent clears 6.21:1
  as link text on paper and 6.39:1 for a white label on the fill in light,
  8.62:1 in dark — both sit inside sRGB. The
  `@supports not (color: light-dark(…))` flat-sRGB fallback is restated to match,
  and every pair still clears WCAG AA in both schemes.
- **Buttons are fully rounded.** The shared button rule takes a new
  `--fertig-rp` (pill) token instead of the control radius. It matches the
  badge, the switch and the progress bar, which were already pills. Set
  `--fertig-rp: var(--fertig-r)` for square-shouldered buttons.
- **One radius, and the rest derived from it.** `--fertig-r` (12px) is the base;
  `--fertig-rs` is `calc(var(--fertig-r) * .5)` and `--fertig-rw` is
  `calc(var(--fertig-r) * 1.33)`, so setting the base on `:root` rescales the
  whole sheet instead of desynchronising it. Windows — cards, dialogs, popover
  menus, the select picker, `pre`, `details`, `fieldset`, `aside`, toasts —
  now take `--fertig-rw` rather than the control radius, and full-bleed card
  media follows the card it bleeds into.
- **Badges are uppercase.** They already used the caps *size*; they never got
  the transform that `h5`, `h6` and `th` get.
- **The dialog lost its banded rules.** No hairline under the header or over
  the footer by default; the separation is spacing. The rule now arrives as
  scroll state — a scroll-driven animation fades it in under the header once the
  body has scrolled and out of the footer at the end — so a dialog that fits
  shows no rules at all. Title takes `--fertig-f`, the interface face, at
  600/1.1rem: a monospaced heading font reads as a terminal on a dialog.
- **The `err` tone is red, not clay.** `[data-tone=err]` borrowed
  `--fertig-clay-700`, which at 50% lightness reads brown on a destructive
  button. Now `oklch(52% .16 27)` / `oklch(74% .13 25)` — 5.97:1 with the white
  label, and `--fertig-on-ac` still derives correctly in both themes.
- **The select picker animates open and closed**, with `display` and `overlay`
  transitioned discretely so the close is not a pop.

### Fixed

- **`accent-color` and `caret-color` ignored every local accent.** Both were
  declared once on `:root`. They are inherited properties, so they resolved
  there against the root accent and every descendant inherited that *computed
  colour* — a `[data-accent]` or `[data-tone]` subtree repainted its buttons and
  links but left its checkboxes, radios, ranges and caret on the root's tint.
  Both are now re-declared on the elements that consume them.
- **The segmented control showed a vertical scrollbar.** `overflow-x: auto`
  makes `overflow-y` compute to `auto` as well, and Safari paints a scrollbar
  for a sub-pixel of overflow. The block axis is now clipped (`overflow: auto
  clip`), and group children take their focus ring inside the edge
  (`outline-offset: -3px`) so the clip cannot slice it.
- **The `<select>` marker was a different shape per engine.** Engines without
  `appearance: base-select` fell back to a solid filled triangle while the
  styleable picker drew a thin chevron. The fallback now draws the same
  stroked chevron.
- **The docs site is built with Eleventy.** The pages moved out of hand-edited
  HTML at the repo root into `src/` templates that build to `dist/`, with the
  version flowing from `package.json` as the single source of truth. This is how
  the sheet's own site is maintained; it is not part of the npm package, which
  ships the two CSS files plus the README and licence.
- **The demo template pages are gone.** `app.html`, `app-invoice.html` and the
  whole `templates/` set (`dashboard`, `article`, `pricing`, `signin`) are
  removed from the site and repo; the docs no longer point at them.

## [2.0.0] — 2026-08-31

### Breaking

- **`--a1` / `--a2` are now `--fertig-a1` / `--fertig-a2`, with no alias.**
  These are `@property` registrations, and a registration is global — it cannot
  be layered, scoped or overridden. A two-character name meant a consumer's own
  `--a1` was silently retyped to `<number>`, which is a bug that only a rename
  can fix.

  **To migrate:** if you set `--a1` or `--a2`, rename them. Nothing else
  changes — the values mean the same thing and the elevation scale is
  untouched. If you never set them, there is nothing to do.

  Every other token name is unchanged. They are ordinary custom properties,
  they are the documented API, and they are deliberately short.

A visual refresh, an audit pass, and a component-first repositioning. One token
rename aside, the surface is the same — the same classes and attributes — but
the default look changes visibly, so treat this as a redesign rather than a
drop-in bump.

### Added

- **Named accents.** `data-accent="indigo|sky|sage|clay|plum|gold|slate"` on any
  element retints everything inside it: links, focus rings, filled buttons, the
  caret, the selection. Scoped rather than global, so one section can differ
  from the rest of a page. Each pair is measured — the light tone clears AA as
  link text on paper, the dark tone clears it on the dark ground.
- **Motion tokens.** `--ease-out`, `--ease-in`, `--ease` and the durations
  `--dur-1` / `--dur-2`. The sheet had been animating with a bare `ease`, which
  is the browser default and the flattest curve available.
- `--rs`, a small radius for inline chips and code, so they do not inherit the
  larger control radius and read as lozenges.

### Changed

- **The default accent is indigo**, not the desaturated navy it was. Measured
  6.28:1 as link text on paper and 6.39:1 for a white label on the fill in
  light; 8.72:1 and 10.26:1 in dark. Both sit inside sRGB.
- **Cards no longer paint a tinted strip behind their header and footer.** A
  filled bar across the top of a card is the old panel-heading pattern and is
  what dated the sheet on sight; a hairline separates just as well and lets the
  card read as one surface.
- Radii up: `--r` 6px → 9px, `--rw` 10px → 14px. Controls have more room —
  buttons and fields gained roughly a tenth of an em of padding.
- More things transition, on the named curves: tabs, badges, cards, segmented
  controls and popover items, alongside the controls that already did.
  `:focus-visible` is explicitly excluded — a focus ring has to be there the
  instant focus lands, not fade in after it.

### Fixed

- The tone bar on `.card[data-tone]` follows the corner radius again. It was an
  inset shadow, which does not track the curve cleanly at the larger radius —
  it read as a detached line with gaps at both top corners. It is a background
  layer now, which the radius clips. The duplicate indicator on
  `.card > header` is gone with it: the filled header used to hide it, and
  without the fill both were painting.
- Navigation lists. `[data-layout=sidebar]` shipped without any styling for the
  nav inside it, so the obvious markup — a `<menu>` in a `<nav>` — came out as
  a boxed list group. It is navigation now: no rules between items, no bullets,
  and the link fills the row.
- `aside` and `search` are block landmarks that had no vertical rhythm of their
  own, so whatever followed sat flush against them.

### Fixed — audit pass

An audit pass. Everything here came out of `docs/known-flaws.md`, which lists
what was found, what was verified in a browser, and what was left alone on
purpose.

- **The shell survives a framework wrapper.** The page shell was `body > *`, so
  a React, Vue, Svelte or Next app rendering into `<div id="root">` lost the
  measure, the paper surface and the gutters with nothing on screen to say why.
  The shell now also matches the children of a single `#root`, `#app`,
  `#__next` or `[data-fertig]` wrapper. Every added selector sits inside
  `:where()`, so specificity is unchanged.
- **A floor under the floor.** Every colour token was an unguarded
  `light-dark()`. In an engine without it the tokens were invalid at
  computed-value time, so backgrounds went transparent and colour was
  inherited — a page could land unreadable rather than plain. A
  `@supports not (color: light-dark(…))` block at the end of the layer restates
  the palette in flat sRGB, in both schemes.
- **`data-size`, `data-variant` and `data-block` are scoped to controls.** As
  bare attribute selectors they restyled any element carrying those very common
  attribute names — a `<span data-size="sm">` picked up button padding.
- **The focus ring no longer reshapes what it rings.** `:focus-visible` set
  `border-radius: var(--r)`, which is the element's own radius, not the ring's:
  a focused `<dialog>` snapped from `--rw` (14px) to `--r` (9px). Outlines
  already follow the element's corners, so the declaration is simply gone.
- **`<svg>` stays inline.** It was in the `display: block` rule with `img`,
  `video` and `iframe`, which dropped every inline icon onto its own line.
- **Toasts can stack.** Two `[popover][data-toast]` elements shared one set of
  corner coordinates and overlapped, and an open popover is in the top layer so
  no ordinary wrapper could stack them. `<div popover="manual"
  data-toast-region>` is now the popover, with a `<div data-toast>` per message.
- **A selected tab is visible in Windows High Contrast.** Its cue was a
  `box-shadow` that the forced-colors layer removes, and the replacement set
  `border-color` on an element with `border: 0`. It now sets a real
  `border-bottom`.
- **`--on-ac` survives a custom `--ac` in shipping browsers.** The
  `contrast-color()` guard is real but almost nothing implements it. A relative
  colour branch reaches the same black-or-white decision from the accent's own
  lightness, and has been cross-engine since 2024.
- **`interpolate-size: allow-keywords` is set on `details`, not `:root`.** It is
  inherited, so the old placement changed how *your* `height: auto` transitions
  behaved as a side effect of animating a disclosure.
- **Two universal rules narrowed to what the sheet actually styles.**
  `scrollbar-width: thin` no longer thins the page's own scrollbar (a
  target-size problem for imprecise pointers), and `corner-shape: squircle` no
  longer reshapes your components.
- **`input[type=image]` is a button, not a text field.** It was missing from the
  `:not()` list and got full-width sunken-field treatment.
- **The tooltip is flow-relative and reachable on touch** — logical inset
  properties with a `:dir(rtl)` offset, and `:active` alongside `:hover`. It is
  still decorative, and now says so in the sheet, the README and the docs.
- **`a[target=_blank]`** no longer appends an arrow to a link wrapping an image.
- **Print keeps the footer.** It was hidden along with the toolbar, which drops
  the legal line, the contact and the citations from every printout.
- **The small variant stays small on touch.** `(pointer: coarse)` forced
  `min-height: 44px` on everything; `data-size="sm"` opts down to 32px, still
  above the 24px WCAG 2.5.8 floor.
- `package.json`'s size claim, the one string `tools/sizes.py` does not reach.

### Changed

- `--a1` / `--a2` renamed — see **Breaking** above.

## [1.0.3] — 2026-08-30

### Changed

- `--mut` lifted from 50%/70% lightness to 47%/73%. The weakest muted pairing
  — on the desktop ground in light, on chrome in dark — was 4.96:1 and 5.99:1,
  a hair over AA; it is 5.65:1 and 6.70:1 now. Not taken to AAA, which would need 41.5%: that
  is close enough to `--fg` that muted text stops reading as secondary at all.

### Added

- `--nw`, the column the toolbar's contents line up with. It follows `--w`, so
  nothing changes by default, and `<nav class="wide">` re-points it at the wide
  column — an app screen built on `.wide` no longer gets a wordmark floating in
  the middle of the viewport while its content spans the full width.

### Fixed

- Breadcrumb separators no longer leak into other navigation. The `/` was on
  `nav[aria-label] li + li`, so any labelled `<nav>` containing a `<ul>` — an
  ordinary sidebar — got breadcrumb slashes between its links. Scoped to `ol`,
  matching the layout rule directly above it and the documented markup.
- A `.grid` no longer collides with the block that follows it. It is a
  block-level container and nothing gave it vertical rhythm. The space is on
  `.grid + *` rather than a margin on `.grid` itself, which would collapse out
  through the top of a padding-less container and open a seam above it.
- A segmented control (`role="group"`) with four or more buttons no longer
  pushes the page sideways on a narrow screen. It scrolls within its own width
  instead of wrapping, which would break the joined run of corner radii.
- A `<dl>` with a long value no longer widens the page. The value column was
  a bare `1fr`, whose automatic minimum is its content, so it could not shrink;
  it is `minmax(0, 1fr)` now.

## [1.0.2] — 2026-08-30

### Fixed

- Menus and toasts no longer jump across the viewport as they close. The anchor
  positioning was scoped to `[popover]:popover-open`, but the close is
  transitioned (`display .13s allow-discrete`), so for those 130ms the popover
  still painted while no longer matching the selector — falling back to the UA's
  centred `inset: 0` and visibly flying to the middle of the screen. Both the
  menu and the `[data-toast]` corner override now sit on the base selector.

## [1.0.1] — 2026-08-30

Packaging only; the stylesheet is unchanged apart from its version banner.

### Changed

- `homepage` points at the documentation site rather than the README, and the
  repository URLs follow the repo's rename to `moji2002/fertig`.
- `fertig` and `fertig.css` added as keywords: the package is `fertig`, but
  people search npm for the project's name.

## [1.0.1] - 2026-08-30

### Changed

- npm keywords only: added `css-framework`, `lightweight`, `minimalist`, `html`,
  `frontend`, `ui` and `responsive`. `css-framework` is the term the rest of the
  category (Pico, Water.css) registers under, and it was missing. No stylesheet
  changes — the CSS is byte-identical to 1.0.0.

## [1.0.0] — 2026-08-30

First release. The project and the npm package are `fertig`. The stylesheet
file keeps the name `fertig.css`, because it is a CSS file, and the cascade
layer is `@layer fertig` — a dot in a layer name would declare a sub-layer.

### Added

- Classless styling for the full semantic element set: headings, prose, lists,
  description lists, quotes, rules, code, tables, every form control,
  fieldsets, buttons, details, dialog, figures, media and asides.
- Layout model where direct children of `<body>` are containers — `<nav>` is a
  full-bleed toolbar with a vibrancy blur, and
  `header`/`main`/`footer` are the page.
- Light and dark themes from a single `light-dark()` token block, with
  `data-theme="light|dark"` to override the OS preference.
- Elevation scale (`--up`, `--up2`, `--dn`) whose shadow alphas step up in dark
  mode, since a shadow on a dark ground reads as nothing on its own. The
  shadows come off a real colour token (`--sh`) through relative colour syntax,
  not an HSL triplet you could not use directly.
- Component layer addressed by ARIA rather than by class: segmented controls
  (`role="group"`), tabs (`role="tablist"`), switches (`role="switch"`),
  `[popover]` menus anchored to their invoker, breadcrumbs, `<dialog>` with an
  entrance transition, `aria-busy` spinners and `data-tooltip`.
- Button variants (`data-variant`, `data-size`, `data-icon`, `data-block`) and
  card anatomy (`<header>`/`<footer>`, full-bleed media, `data-tone`,
  `<a class="card">` hover lift).
- Seven optional classes: `.row`, `.grid`, `.card`, `.badge`, `.muted`,
  `.center`, `.wide`.
- Dialog anatomy: an optional `<header>` and `<footer>` that run edge to edge
  and stay pinned while the body scrolls. Sticky rather than a grid, because a
  classless sheet has no wrapper around the loose middle children to make a
  grid row out of; the sticky offsets are negative so the chrome pins to the
  dialog's border edge rather than its padding edge, which is where content
  would otherwise scroll through.
- A max-width scale on Tailwind's names — `.max-w-xs` through `.max-w-7xl`,
  plus `.max-w-full`, `.max-w-none` and `.max-w-prose`. Whole rather than
  partial: a scale where `.max-w-2xl` works and `.max-w-3xl` silently does not
  is worse than no scale. They are `max-inline-size`, so they still mean
  "along the text" in a vertical writing mode.
- Layout utilities, named after Tailwind's so the names transfer: `.flex`,
  `.flex-col`, `.flex-wrap`, `.flex-1`, `.grid-cols-2|3|4`,
  `.items-start|center|end`, `.justify-start|center|end|between`,
  `.gap-0|1|2|3|4|6`, `.mx-auto`, `.ms-auto`, `.me-auto`, `.w-full`,
  `.hidden`. Layout only — no colour, type or sizing scale, and no responsive
  variants, which would need a build step.
- Right-to-left support. Every inline-direction rule is flow-relative, with
  `:dir(rtl)` rules for the two that cannot be — the switch knob's `translate`
  and the fallback `<select>` chevron's background position. Verified by
  rendering a Persian page in both directions.
- A second layer, `fertig-a11y`, declared after `fertig`. The forced-colors
  block lives there and wins on layer order.
- Print styles, `prefers-reduced-motion` handling, and thin scrollbars.
- Robustness: `overflow-wrap: break-word`; `:required`, `:read-only` and
  `:autofill` states; slashed, tabular numerals; `object-fit` on card media;
  smooth in-page scrolling; `overscroll-behavior` on overlays; `@page` margins
  with orphan and widow control.
- Environment queries: `inverted-colors` and `color-gamut: p3`.
- `anchor-size()` and `position-visibility` for menus, `::spelling-error`,
  and Safari's native `<input switch>` styled to match `role="switch"`.

### Browser support

- Two-year support policy: the sheet targets browsers from the last two years.
  The only thing carried for the ones before them is the flat-sRGB palette
  above ("a floor under the floor"). It ships no vendor prefixes except the
  three no engine has replaced (`-webkit-text-size-adjust`, the autofill
  repaint, and the `progress` pseudo-elements).
- The sheet is wrapped in `@layer fertig`, so unlayered author CSS overrides it
  at any specificity. There is no `!important` anywhere in it: inside a cascade
  layer an important declaration outranks your own unlayered CSS, which would
  contradict the point of shipping in a layer.

### Site

- A blocks gallery with 16 ready-to-use patterns — toolbars, stat rows, tables
  with totals, pagination, empty states, sign-in, settings, alerts, confirm
  dialogs, tabs, menus, pricing and shortcuts. Each snippet is generated from
  its own live preview at runtime, so the code and the demo cannot drift apart.
- `llms.txt` describing the layout model, the seven classes, the ARIA
  component conventions and the tokens.

### Verified

- All foreground/background pairs meet WCAG 2.1 AA (≥ 4.5:1) in both themes,
  at rest and on hover; the tightest is muted text on chrome at 4.65:1.
- Progressive enhancement behind `@supports`: `contrast-color()`,
  `::details-content` with `interpolate-size`, `field-sizing`,
  `corner-shape: squircle`, `text-box: trim-both` and `@property`-typed
  shadow alphas. None of them are required for the sheet to work.
- Tables scroll themselves below 40rem instead of widening the page.
- 28.0 KB raw, 7.6 KB gzipped, 6.7 KB brotli (`fertig.min.css`).
