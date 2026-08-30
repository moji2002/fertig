# Audit: what was wrong with fertig, and what was done about it

An adversarial read of `fertig.css`, 2026-08-31, against v1.1.0 (990 lines).
Findings first, then what shipped. Kept in the repo because several of the
fixes look arbitrary in the diff and only make sense with the failure written
down next to them.

**Evidence grades**

- **Verified** — reproduced in Chromium (Playwright) against the real file.
  Computed values quoted.
- **Source** — read off the stylesheet; no browser needed to see it.
- **Inference** — reasoning about consequences, not measured.

**Status** — `FIXED`, `WONTFIX` (a deliberate opinion, left alone), or
`WITHDRAWN` (the finding did not survive testing).

---

## Critical

### 1. The whole layout collapsed inside a wrapper element — FIXED

**Verified.** The shell was `body > *`. Every React, Vue, Svelte and Astro app
renders into `<div id="root">`, and with one wrapper in the way a `<main>`
computed:

| property | expected | with a `#root` wrapper |
|---|---|---|
| `max-width` | `608px` (38rem) | `none` |
| `background-color` | `--el` (paper) | `rgba(0,0,0,0)` |
| `padding-left` | `30.4px` | `0px` |

Measure, paper, hairlines and gutters all gone — silently, with no error.
Typography and controls still worked, which made it look like fertig had no
layout rather than like the markup being one level too deep. The most likely
first impression a framework user would ever form.

**Fix.** The shell now matches `body`'s children *or* the children of a single
`#root` / `#app` / `#__next` / `[data-fertig]` wrapper. The wrapper list is
inside `:where()`, so `body > *` stays (0,0,1) and `body > header` stays (0,0,2)
— no override anyone had written changes meaning. Re-verified: `max-width:
608px`, paper background, `padding-left: 30.4px`, and the toolbar still sticky
and full-bleed inside the wrapper.

### 2. Every core token died together below the support floor — FIXED

**Source + inference.** `--bg`, `--el`, `--face`, `--fg`, `--mut`, `--bd`,
`--tb`, `--ac` were all unguarded `light-dark()`. Custom properties accept
almost any token stream at parse time, so a plain fallback declaration *before*
them does not help — the `light-dark()` one wins and then fails at
computed-value time. The result is `unset`: transparent background, inherited
colour. Not "unstyled but readable" — potentially light text on a light ground.

**Fix.** A `@supports not (color: light-dark(#000, #fff))` block at the end of
the layer restates the palette as flat sRGB hex, with a
`prefers-color-scheme: dark` twin and a `[data-theme=dark]` twin. Last in the
layer, so it wins on order over the token block at the top. Nothing else needs
a twin: an invalid `--ac` on a `[data-tone]` or `[data-accent]` element just
inherits the one from `:root`, which is the correct degradation.

### 3. Unnamespaced `data-*` selectors collided with everything — FIXED

**Verified.** `[data-size=sm]` was a bare attribute selector: a
`<span data-size="sm">` with nothing to do with fertig computed
`padding: 2.72px 9.52px; font-size: 13.6px`. `data-size`, `data-variant` and
`data-block` are common attribute names in component libraries and framework
wrappers, and a classless sheet is meant to be safe to drop onto existing
markup.

**Fix.** Scoped to controls — `:is(button, a, input, select, label)[data-size]`
and `:is(button, a, input)[data-variant]`. Re-verified: the `<span>` is
untouched, `button[data-size=sm]` still styled. The fertig-specific names
(`data-avatar`, `data-skeleton`, `data-carousel`, `data-layout`, `data-tone`,
`data-accent`) are left global — they are unlikely to collide and are meant to
work on any element.

### 4. `@property` registered two-character global names — FIXED

**Source.** `@property --a1` / `--a2` are global: not layerable, not scopable,
not overridable. A consumer already using `--a1` had it silently retyped to
`<number>`, dropping any non-numeric value.

**Fix.** Renamed to `--fertig-a1` / `--fertig-a2`. The rest of the token
vocabulary (`--f`, `--w`, `--r`, `--bg`, `--ac`, …) is left alone: those are
ordinary custom properties, they are the documented public API, and renaming
them would break every consumer for a smaller collision risk.

---

## Correctness bugs

### 5. `:focus-visible` mutated the element's real geometry — FIXED

**Verified.** The ring rule carried `border-radius: var(--r)` — the element's
own corner radius, not the outline's. A focused `<dialog>` computed
`border-radius: 9px` instead of its `14px` (`--rw`), so dialogs, drawers and
the toolbar changed shape for as long as they held focus. Outlines already
follow the element's existing radius in every current engine, so the
declaration bought nothing.

**Fix.** Removed. Re-verified: focused dialog now computes `14px`.

### 6. Inline SVG was forced to `display: block` — FIXED

**Verified.** `svg` sat in the `display: block` rule with `img`, `video` and
`iframe`, so an `<svg>` inside a paragraph or a button broke the line and
dropped onto its own row.

**Fix.** `svg { max-width: 100%; vertical-align: middle }`, left inline.
Re-verified: `display: inline`.

### 7. Responsive tables lose their table semantics — WITHDRAWN

**Verified — the finding was wrong.** The concern was that
`table { display: block }` below 40rem strips the implicit `table` role from
the accessibility tree. Tested at a 480px viewport with `display` confirmed as
`block`: Chromium reports the full structure — `table → caption, rowgroup, row,
columnheader, cell` — identical to an untouched table on the same page.

The rule stands. Residual risk: only Chromium was tested. Gecko and WebKit were
not, and this behaviour has changed across engine versions historically, so it
is worth re-testing rather than assuming.

### 8. Selected tabs vanished in Windows High Contrast — FIXED

**Source.** `[role=tab][aria-selected=true]` marked selection with
`box-shadow: inset 0 -2px 0 var(--ac)`. The forced-colors layer removes all
box-shadows and tried to restore the cue with `border-color: Highlight` — but
`[role=tab]` sets `border: 0`, so there was no border for the colour to land
on. Net result in HCM: no visible selected tab.

**Fix.** `border-bottom: 2px solid Highlight` in the a11y layer.

### 9. Tabs are styling only — DOCUMENTED (no code change)

**Source.** Nothing switches panels. This is unfixable in CSS for the right
reason: `aria-selected` must be a real attribute for a screen reader to
announce the correct tab, and CSS cannot set attributes. The README already
carries this under "Components that work without JavaScript", with tabs listed
as **styled only** and the snippet in the docs. No change needed.

### 10. Toasts stacked on top of each other — FIXED

**Source.** `[popover][data-toast]` pinned every toast to the same corner
coordinates, so two open toasts overlapped exactly. An open popover is promoted
to the top layer, so no ordinary wrapper can position a stack.

**Fix.** Make the *region* the popover:
`<div popover="manual" data-toast-region>` with a `<div data-toast>` per
message. `pointer-events: none` on the region, `auto` on the children, so the
column does not eat clicks on the page under it. The single-toast form still
works unchanged. Re-verified: two toasts at `top: 668` and `top: 729`.

### 11. The tooltip is decorative, not accessible — PARTLY FIXED

**Source + inference.** `[data-tooltip]::after` renders `attr()` content in a
pseudo-element:

- Generated content is not reliably exposed to assistive tech and carries no
  `aria-describedby` relationship — invisible to screen readers.
- WCAG 2.1 SC 1.4.13 requires hover content be dismissible; a pseudo-element
  cannot be dismissed without script.
- Clipped by any scroll container, and `[role=group]` is one.
- It used physical `bottom` / `left` in a sheet that is otherwise scrupulous
  about logical properties.

**Fix.** Logical inset properties with a `:dir(rtl)` offset twin, and `:active`
alongside `:hover` so it is reachable on touch. The screen-reader and
dismissibility problems are not solvable in CSS, so they are now stated
plainly — in the stylesheet comment, the README component table, and a note
under the docs example — with the instruction to put the same words in
`aria-label` or `aria-describedby` and never say anything in a tooltip that is
said nowhere else.

### 12. `interpolate-size: allow-keywords` was set globally — FIXED

**Source.** It was on `:root`, inside the `details` block. It is inherited, so
it changed how *the consumer's* transitions to `height: auto` / `width: auto`
behave — a document-wide behavioural change made to enable one component's
animation.

**Fix.** Moved to `details`. `::details-content` inherits from it, so the
disclosure animation is unaffected.

### 13. `html { scroll-behavior: smooth }` is imposed on the document — WONTFIX

**Source.** Correctly gated behind `prefers-reduced-motion`, but it still
overrides router and `scrollTo` positioning, which is the standing complaint
against every sheet that ships it. There is no CSS for "only for anchor
navigation", and removing it costs the anchor UX it exists for. Left as a
deliberate opinion; the one-line opt-out is `html { scroll-behavior: auto }`
in your own unlayered CSS.

### 14. `*` rules with real cost — FIXED

**Verified / source.** Two universal selectors carried declarations:

- `* { scrollbar-width: thin; scrollbar-color: … }` — computed `thin` on
  `body`, narrowing the page's own scrollbar and every scroller fertig never
  styled. A target-size concern for anyone using a pointer imprecisely.
- `* { corner-shape: squircle }` — reshaped the consumer's components too.

**Fix.** Both narrowed to element lists the sheet actually styles. An A/B of
100 elements × 20 computed properties on a component gallery found this to be
the *only* visible difference across the whole audit pass: `scrollbar-width`
`thin → auto` on non-scrolling elements, with `pre`, `table`, `textarea`,
`[popover]`, `[role=group]` and the carousel keeping `thin`.

### 15. The input type list was a maintenance trap — FIXED

**Source.** `input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=file],[type=submit],[type=button],[type=reset])`
omitted `type=image`, so an image submit button got full-width block field
treatment with a sunken shadow.

**Fix.** `[type=image]` added. Re-verified: `display: inline-block`, intrinsic
width. Any *future* input type is still opted in by default — that is inherent
to a `:not()` list and is the right default for a text-like input.

---

## Opinions

Strong enough that a user dropping fertig on existing HTML may think something
is broken, but they are the sheet's point of view.

| | |
|---|---|
| `<aside>` becomes an accent-bordered callout | **WONTFIX** — the sheet's read of `<aside>`. It is also the complementary landmark people use for a real sidebar, which will arrive boxed. |
| `<menu>` becomes a bordered list group | **WONTFIX** — `<menu>` is spec-equivalent to `<ul>`; using it as a plain list gets you a card. |
| Every `<img>` / `<video>` gets a radius and a drop shadow | **WONTFIX** — transparent logos pick up a shadow around their bounding box. Override with `img { box-shadow: none }`. |
| `a[target=_blank]::after` injects "↗" | **FIXED** — now `:not(:has(> img, > svg))`, so image links are left alone. |
| Print hid the footer | **FIXED** — the toolbar is still dropped; the footer stays, because the legal line, the contact and the citations live there. |
| `(pointer: coarse)` forced `min-height: 44px` on everything | **FIXED** — `data-size="sm"` opts down to 32px, still above the 24px WCAG 2.5.8 floor. 44px (2.5.5 AAA) remains the default. |
| `--on-ac` only self-corrected where `contrast-color()` exists | **FIXED** — a relative-colour branch derives black-or-white from the accent's own lightness. Verified against five accents: `oklch(50% .19 275) → white`, `#ffcc00 → black`, `#111 → white`. |

---

## Documentation drift — FIXED

The size claims were stale in eleven places across four files plus
`package.json`. They are now generated: `tools/sizes.py` records what it last
wrote in `tools/sizes.json` and replaces exactly those strings, so it cannot
mangle unrelated prose. Run it after a build:

```sh
node build.js && python3 tools/sizes.py
```

`package.json` is outside its file list (it is JSON, not prose) and was the one
string left to fix by hand.

**Cost of this audit pass**, measured with `gzip -9`, KB = 1024:

| Build | Before | After |
|---|---|---|
| `fertig.min.css` | 7.9 KB | **8.4 KB** |
| `fertig.core.min.css` | 6.5 KB | **6.9 KB** |

+0.5 KB gzipped, most of it the framework-wrapper selectors (repeated eight
times) and the below-the-floor palette. Worth it: the wrapper fix alone decides
whether the sheet works at all for most of its likely users.

Separately, `docs/browser-support-research.md` found the old
"built only on CSS that shipped in the last two years" claim false — most
required features are 2–4½ years old. That correction has landed in `README.md`
and `docs.html`, which now put the two-year window on *browsers*, not on CSS.

---

## What is genuinely good

Recorded so a later pass does not "fix" it:

- The `@layer fertig, fertig-a11y` ordering, and the reasoning that unlayered
  consumer CSS beats both without `!important`.
- The contrast work: `--mut` lifted from 50%/70% to 47%/73% with measured
  ratios written down, and the accent measured as link text and as a label on
  fill, in both themes.
- `dl { grid-template-columns: max-content minmax(0, 1fr) }` — the comment about
  `1fr`'s `min-width: auto` is exactly right and most sheets get it wrong.
- `.flex-1 { flex: 1; min-width: 0 }`, for the same reason.
- Popover anchoring deliberately *not* scoped to `:popover-open`, with the
  closing-frame reasoning written down. That is a real bug someone already hit.
- Dropping relative colour for `color-mix()` in the shadow tokens to keep
  Safari 17.5 inside the floor — the same instinct as finding 2, applied first.
- The forced-colors layer existing at all.
