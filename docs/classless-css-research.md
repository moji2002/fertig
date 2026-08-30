# Classless CSS: what Pico does, and where the weight goes

Research backing the design of `fertig.css`. Written 2026-08-29.

## Measurement (empirical — reproducible)

Fetched from jsDelivr and measured locally with `wc -c` / `gzip -9`:

| File | Raw | Gzip |
|---|---|---|
| `@picocss/pico@2/css/pico.classless.min.css` | 71,040 B | 10,338 B |
| `@picocss/pico@2/css/pico.min.css` | 83,319 B | 11,653 B |

```sh
curl -sL https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.min.css -o p.css
wc -c < p.css; gzip -9c p.css | wc -c
```

## Where Pico's 71 KB actually goes (empirical — read from the built file)

1. **Color system.** Pico ships a full designed palette (~20 hues × 
   ~16 steps) plus per-theme semantic mappings, as CSS custom properties
   declared twice — once for light, once for dark. Hundreds of
   declarations that a single-accent theme does not need.
2. **Inline SVG data URIs.** Select arrows, checkbox/radio checkmarks,
   validation state icons, and details markers are embedded as
   base64/URL-encoded SVG in `background-image`. These compress poorly
   (already-entropy-dense) and are individually multi-hundred-byte.
3. **Every element themed twice.** Light and dark blocks repeat the full
   selector list rather than only swapping the tokens they change.
4. **Breakpoint ladder.** Container widths are redefined at 5 breakpoints.

**Inference (mine, not measured per-rule):** items 1 and 2 are the bulk.
A build that swaps the palette for ~30 tokens and draws the arrow/check
in CSS borders should land near 10–15 % of Pico's size at comparable
element coverage.

## Layout model (documented — picocss.com/docs/classless)

> "`<header>`, `<main>` and `<footer>` inside `<body>` act as containers
> to define a centered or a fluid viewport."

Two builds: centered (default) and fluid. Recompiling with a different
root selector (`#root`) is the documented escape hatch for React/Next,
where `body` is not the semantic parent. **We copy this model** — it is
the correct one, and it is why classless CSS works at all: it gives the
sheet a predictable place to hang page width without a `.container`.

## Element coverage a classless sheet must have (convention)

Derived from reading Pico's and Water.css's selector lists — this is
convention among classless frameworks, not a standard:

headings · p · a · lists (ul/ol/dl) · blockquote · hr · mark · abbr ·
code/pre/kbd/samp/var · table (+ thead/tfoot/caption) · form controls
(text inputs, select, textarea, checkbox, radio, range, file, color) ·
fieldset/legend · button + input button types · details/summary ·
dialog · progress · figure/figcaption · img/video/iframe · nav ·
aside · footer

Anything missing from that list shows up as unstyled browser default on
a real page, which is what makes a classless sheet feel unfinished.

## Design decisions this justifies

| Decision | Reason | Evidence grade |
|---|---|---|
| Single accent token, no palette | ~40 % of Pico's bytes | empirical |
| CSS-drawn select arrow + checkmark | avoids base64 SVG | empirical |
| Tokens declared once, overridden by delta | avoids double-theming | empirical |
| One container width, no breakpoint ladder | mono text wants a fixed measure | heuristic |
| `header`/`main`/`footer` as containers | matches Pico; predictable | convention |
| `prefers-reduced-motion` gate on transitions | WCAG 2.1 SC 2.3.3 (AAA) / widely applied | normative |
| Monospace body text | user requirement, not a legibility claim | n/a |

**Caution:** setting body copy in monospace is a stylistic choice.
Reading-speed research on monospace vs proportional body text is thin
and mostly about code, so I make no legibility claim for it either way.

## Sources

- https://picocss.com/docs/classless
- https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.min.css
- https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html

## Addendum: bugs this research did not prevent

- **`light-dark()` takes colors, not numbers.** An early build used
  `light-dark(.05, .40)` for shadow alpha. That is invalid, so every
  `hsl(… / var(--a1))` became invalid, and every `box-shadow` computed to
  `none` — the depth was silently absent in both themes. Caught by reading
  `getComputedStyle(el).boxShadow` in a real browser, not by looking at the
  file. Per-theme numeric tokens need a real `prefers-color-scheme` block.
- **`display:block` on `<table>`** (a common trick to get horizontal scroll)
  makes the table shrink-to-fit inside its own block box, so cells stop
  filling the width. Reverted to a normal table.

Verification method that worked: serve the page, then assert on computed
styles for a representative element per subsystem, rather than eyeballing.

## Addendum 2: three more bugs the browser caught

- **`position-area: bottom span-inline-end` is invalid.** The two keywords must
  come from the same axis system — mixing a physical keyword (`bottom`) with a
  logical one (`span-inline-end`) drops the whole declaration silently, leaving
  the popover pinned to the viewport's top-left by the UA's `inset: 0`.
  `CSS.supports('position-area', …)` distinguishes the valid forms; the fix was
  `block-end span-inline-end`. Anchoring also needs `position-anchor: auto`
  (binding the popover to its `popovertarget` invoker) and `inset: auto`.
- **Specificity beat intent in the popover menu.** The generic
  `:is(button, [type=submit], …):hover:not(:disabled)` scores 0-3-0 and out-ranked
  `[popover] :is(a, button):hover` at 0-2-1, so hovered menu items kept the pale
  button fill while still taking `color: #fff` — white text on near-white. `:is()`
  takes the specificity of its *most specific* argument, which makes these
  convenience selectors much heavier than they look.
- **An inset box-shadow is painted over by a child's background.** A
  `data-tone` rule drawn as `inset 0 2px 0` on a card vanished under the card's
  own `<header>` fill. Borders would have worked but change the box geometry;
  the fix was to re-declare the inset on the header itself.

Method note: each of these looked correct in the source and was only visible by
asserting on `getComputedStyle` / `getBoundingClientRect` in a real browser.

## Addendum 3: the accessibility bug that would have shipped

Contrast was measured in-browser from the *computed* token values, in both
themes, before release. One pair failed:

- **White text on the dark-mode accent: 2.75:1.** The filled `.primary` /
  `[type=submit]` button hardcoded `color: #fff`, which is correct against the
  light theme's `#0064e1` (5.37:1) but fails badly against the dark theme's
  lighter `#4a9eff`. A light accent needs *dark* text. Fixed by adding an
  `--on-ac: light-dark(#fff, #06121f)` token and using it everywhere text sits
  on the accent — the primary button and popover menu item hover. Now 6.85:1.

The general lesson: a theme that flips only the *background* lightness will
silently invert the contrast requirement for anything painted in the accent.
Any "on-colour" needs its own token, not a literal.

**Measurement caveat.** Reading `getComputedStyle` in the same task that sets
`data-theme` can return a stale value — an early run reported 3.51:1 because
the background had not been recalculated yet while the colour had. Force a
reflow (`void el.offsetHeight`) between the theme switch and the read.

Final figures, both themes AA-passing, tightest pair 4.65:1 (muted on chrome):
see the table in README.md.
