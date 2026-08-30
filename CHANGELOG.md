# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). The public surface
is the token names, the class names (the seven, plus the layout utilities),
and the ARIA attributes the component layer reads — changes to any of those
are breaking.

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

- Two-year support policy: the sheet targets browsers from the last two years
  and carries nothing for the ones before them. It ships no vendor prefixes
  except the three no engine has replaced (`-webkit-text-size-adjust`, the
  autofill repaint, and the `progress` pseudo-elements).
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
