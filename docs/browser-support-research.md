# Browser support: what fertig actually requires

Verified 2026-08-31 against two primary datasets, installed at that date:

- `@mdn/browser-compat-data` — per-feature first-shipping version per engine.
  Source of every `Chrome N / Safari N / Firefox N` number below.
- `web-features` 3.36.0 (the WebDX Community Group Baseline dataset) — source of
  every "Baseline since" date. A Baseline *low* date is the day the last of the
  three engines shipped it; *high* is 30 months after that.

Evidence grade: **empirical** throughout — these are shipping records, not
opinion. The only inference in this document is the per-component roll-up,
which is my own `max()` over the features each component uses; it is marked as
such.

## The claim under test

> "built only on CSS that shipped in the last two years"

**False.** Almost none of the CSS fertig *requires* shipped in the last two
years — most of it is 2 to 4½ years old. Meanwhile most of the CSS that really
did ship in the last two years is optional, sitting behind `@supports`.

Required (unguarded) features, by the date the last engine shipped them:

| Feature | Chrome | Safari | Firefox | Cross-engine since | Age on 2026-08-31 |
|---|---|---|---|---|---|
| `@layer` | 99 | 15.4 | 97 | 2022-03-14 | 4 yr 5 mo |
| container queries | 105 | 16 | 110 | 2023-02-14 | 3 yr 6 mo |
| `oklch()` | 111 | 15.4 | 113 | 2023-05-09 | 3 yr 3 mo |
| `color-mix()` | 111 | 16.2 | 113 | 2023-05-09 | 3 yr 3 mo |
| `@media (update)` | 113 | 17 | 102 | 2023-09-18 | 2 yr 11 mo |
| `:user-invalid` | 119 | 16.5 | 88 | 2023-11-02 | 2 yr 10 mo |
| `:has()` | 105 | 15.4 | 121 | 2023-12-19 | 2 yr 8 mo |
| `light-dark()` | 123 | 17.5 | 120 | 2024-05-13 | 2 yr 3 mo |
| `text-wrap: balance` | 114 | 17.5 | 121 | 2024-05-13 | 2 yr 3 mo |
| `@property` | 85 | 16.4 | 128 | 2024-07-09 | 2 yr 1 mo |
| `@starting-style`, `transition-behavior` | 117 | 17.5 / 17.4 | 129 | 2024-08-06 | 2 yr 0 mo |
Not one required feature is younger than two years. The newest,
`@starting-style`, cleared the two-year line on 2024-08-06 — 25 days ago — and
`@layer` is more than twice the claimed age.

Relative colour (`oklch(from …)`, cross-engine 2024-09-16) used to be on this
list and was the only entry inside the two-year window. It is now behind
`@supports`; see *Fallbacks added* below.

The genuinely recent CSS in the sheet is all behind `@supports`:
`corner-shape` (Chrome 139, Aug 2025), `contrast-color()` (Baseline
2026-04-10), `field-sizing` (Baseline 2026-06-16), `appearance: base-select`
(Chrome 135, still Chromium-only).

So the sentence inverts the sheet's actual shape. What is true is the
*browser* policy, not the *CSS* policy: the oldest browser that runs the sheet
fully is Firefox 129, released August 2024 — two years ago this month. That is
the two-year window, and it is worth saying that way round.

## The real floor

| Engine | Minimum | Why that version |
|---|---|---|
| Chrome / Edge | **123** | `light-dark()` (123) |
| Safari | **17.5** | `light-dark()`, `@starting-style`, `text-wrap: balance` (17.5) |
| Firefox | **129** | `@starting-style`, `transition-behavior` (129) |

Chrome 125 was over-stated in the old docs; nothing unguarded needs past 123.
Chrome 125 is the first version with *anchor positioning*, which is
`@supports`-gated.

Safari 17.5 was over-stated too, at the time this was first written: the sheet
used relative colour unguarded, which needs Safari 18. That has since been
fixed (below), so 17.5 is now correct rather than merely claimed.

## Fallbacks added

Relative colour was the only required feature inside the two-year window, and
it was doing two different jobs:

1. **Setting an alpha on `--sh`** — eight times, for `--sh1`, `--sh2`, `--dn`,
   the toolbar and footer shadows, the menu/toast/card-hover drops, the dialog
   shadow and the dialog backdrop. `color-mix(in srgb, var(--sh) N%,
   transparent)` does this exactly, is Baseline since 2023-05-09, and keeps
   `--sh` overridable. Verified pixel-identical in Chromium (which supports
   both) at alphas .08, .35 and .5 — `rgb(237,237,238)`, `rgb(176,176,177)`,
   `rgb(142,142,143)` from either notation.
2. **Lightening `--ac` for the filled-button hover** — `calc(l + .05)`, which
   genuinely needs relative colour to hold hue and chroma. This one stays,
   behind `@supports (color: oklch(from red l c h))`. The fallback is
   `color-mix(in oklab, var(--ac), #fff 9%)`, which lands on the same
   lightness but a little flatter: `rgb(86,97,210)` against
   `rgb(86,95,222)`, a ~5% difference in the blue channel on a hover state.

Cost: **+42 bytes gzipped**, measured by minifying both versions.

Two features remain above the floor with no fallback written, because none
exists: `scrollbar-color` (Safari 26.2) and `accent-color` (Safari 26.2). An
engine without them paints its own scrollbar and its own checkbox tick. Both
are commented as deliberate in the source.

### Two cosmetic exceptions, deliberately not gated

`scrollbar-color` (Baseline 2025-12-12, Safari 26.2) and `accent-color`
(Safari 26.2) reached cross-engine support well after the floor above. They are
left unguarded because an engine without them simply paints its default
scrollbar and its default checkbox tick — there is nothing to fall back to and
nothing to break.

## Per-component minimum versions

Inferred: each row is `max()` over the unguarded features that component uses,
on top of the sheet-wide floor (Chrome 123 / Safari 17.5 / Firefox 129).

| Component | Chrome | Safari | Firefox | Above the floor because |
|---|---|---|---|---|
| Type, tables, cards, layout utilities, badges, avatars, skeletons, tones | 123 | 17.5 | 129 | floor only |
| Forms, buttons, switch, segmented, tabs | 123 | 17.5 | 129 | floor only (`:dir()` 120/16.4/49) |
| `.card` as `@container` | 123 | 17.5 | 129 | container queries 105/16/110 |
| `<dialog>`, drawer/sheet | 123 | 17.5 | 129 | `dialog` 37/15.4/98; animation is `@starting-style` |
| `[popover]` menu, tooltip, toast | 123 | 17.5 | 129 | `popover` 114/17/125 |
| Carousel | 123 | 17.5 | 129 | `scroll-snap` 69/11/99; `overscroll-behavior-x` degrades |
| Sticky-sidebar app layout | 123 | 17.5 | 129 | media range syntax 104/16.4/102 |

Nothing ships a component that needs more than the floor. Every component that
*wants* something newer asks for it through `@supports`.

### Enhancements, and the version each one starts at

All optional. Without them the component still works; it is only less polished.

| Enhancement | Chrome | Safari | Firefox | Baseline | Without it |
|---|---|---|---|---|---|
| Relative colour `oklch(from …)` | 122 | 18 | 128 | 2024-09-16 | `color-mix` lightens the button hover, a shade flatter |
| Anchored `[popover]` menus (`anchor-name`, `position-area`, `anchor-size()`) | 129 | 26 | 147 | not yet | menu centres on screen |
| `position-visibility: anchors-visible` | 125 | 26.2 | 147 | not yet | menu stays when anchor scrolls off |
| `field-sizing: content` (textarea grows) | 123 | 26.2 | 152 | 2026-06-16 | fixed height, drag to resize |
| `::details-content` (animated disclosure) | 131 | 18.4 | 143 | 2025-09-16 | snaps open |
| `interpolate-size: allow-keywords` | 129 | — | — | Chromium only | as above |
| `contrast-color()` | 147 | 26 | 146 | 2026-04-10 | hand-picked `--on-ac` |
| `text-box: trim-both` (cap-height headings) | 133 | 18.2 | 154 | not yet | font half-leading stays |
| `appearance: base-select` | 135 | 27 | 149 (flag) | not yet | native dropdown |
| `corner-shape: squircle` | 139 | — | — | Chromium only | circular-arc corners |
| `::spelling-error` / `::grammar-error` | 121 | 17.4 | — | not yet | engine's own underline |
| `text-wrap: pretty` | 117 | 26 | — | not yet | `balance`-only headings, ragged paragraphs |
| `overlay` in the transition list | 117 | — | — | Chromium only | top-layer pops rather than fades |

## What to say instead

Accurate one-liners, in descending punchiness:

- "Runs on Baseline CSS. Needs a browser from the last two years."
- "Every browser released since August 2024 — Chrome 123, Safari 17.5,
  Firefox 129."
- "No polyfills, no fallback build. The newest thing it *requires* is
  `@starting-style`, cross-engine since August 2024."

Two things these lines must not overclaim, both checkable with Ctrl-F:

- The sheet does ship three vendor prefixes — `-webkit-text-size-adjust`, the
  `-webkit-text-fill-color` autofill repaint, and the `progress`
  pseudo-elements. Nothing has replaced them, so say "three prefixes, all
  still the only way to do the thing", not "no prefixes".
- It does carry one thing for browsers below the floor: the `@supports not
  (color: light-dark(…))` sRGB palette. So not "carries nothing for the ones
  before it".

## Reproducing this

```sh
npm i web-features @mdn/browser-compat-data
node -e "const {features}=require('web-features');
  console.log(features['starting-style'].status)"
node -e "const bcd=require('@mdn/browser-compat-data');
  console.log(bcd.css.types.color.oklch.relative_syntax.__compat.support)"
```

Re-run before each release; Baseline dates move as engines ship.
