# What the classless field actually ships (surveyed 2026-08-31)

Why this file exists: the positioning on the homepage — that fertig gives you
ARIA-addressed components with no JavaScript, on CSS nobody else in this field
uses — is a competitive claim. Competitive claims rot. This records what was
verified, how, and when, so the claim can be re-checked rather than repeated on
faith.

## Method (empirical)

Eleven shipped stylesheets were downloaded from npm/jsDelivr on 2026-08-31 and
grepped directly. Sizes below are measured with `wc -c` and `gzip -9`, not the
numbers the projects advertise — several of those are stale.

## Modern CSS across the field (empirical — grepped from shipped files)

| Feature | Libraries using it, of 11 |
|---|---|
| `oklch()` / `lch()` / `lab()` | 0 |
| `light-dark()` | 0 |
| `@layer` | 0 |
| `@property` | 0 |
| `@container` | 0 |
| `anchor-name` / `position-anchor` | 0 |
| `color-mix()` | 0 |
| `[popover]` / `:popover-open` | 0 |
| `:has()` | 2 (Pico, matcha) |
| `[role=]` / `[aria-]` selectors | 2 (Pico; Simple.css trivially) |
| Logical properties | 3 (Pico 17 uses, Simple.css 10, MVP 3) |
| `[dir=rtl]` handling | 2 (Pico, Simple.css) |

The field is built on roughly 2019 CSS. That is the gap fertig occupies.

## Components (empirical)

No classless library ships working ARIA tabs. Not one.

- **Tabs** — zero libraries. Pico's *first issue ever filed* is a tabs request
  (picocss/pico#1), still open after four years; one commenter: "Missing tabs
  are the only component that stops me from using picocss." Two commenters
  independently point out that `role=tablist`/`tab`/`tabpanel` would allow it
  classlessly. matcha has the same request open (lowlighter/matcha#48).
- **Switch** — one: Pico's `[type=checkbox][role=switch]`.
- **Tooltip** — one: Pico, via `[data-tooltip]`, not ARIA.
- **Dropdown menu** — two, both compromised. Pico's needs a `.dropdown` class.
  Bahunya's is `:hover` only, with no `:focus-within`, so it is unusable by
  keyboard or touch.
- **Modal** — several style `<dialog>`; none make it work without your JS.
  Pico's docs say so outright: "Pico does not include JavaScript code. You need
  to implement your JS to interact with modals."
- **Segmented control, popover, anchor positioning** — zero.

## Measured size (empirical)

| Library | raw | gzip |
|---|---:|---:|
| Concrete | 3,103 | 1,163 |
| Sakura | 4,098 | 1,356 |
| new.css | 4,789 | 1,850 |
| Tacit | 6,557 | 2,100 |
| MVP | 10,267 | 2,689 |
| Simple.css | 9,429 | 2,814 |
| Bahunya | 10,674 | 2,900 |
| awsm | 13,451 | 3,130 |
| Water (auto) | 22,668 | 3,610 |
| matcha | 37,577 | 8,856 |
| Pico (classless) | 71,040 | 10,432 |
| Pico (full) | 83,319 | 11,740 |

**This is why fertig must not claim to be the smallest.** Concrete is 1.16 KB
gzipped and does far less. Size is a supporting fact here, not the pitch.

## What these landing pages lead with (documented — read from the pages)

Almost none lead with size. The dominant claim is "semantic HTML looks good
with no classes": Pico ("Minimal CSS Framework for Semantic HTML"), Simple.css,
MVP, matcha, new.css. Only Water ("under 2kb" — stale; the shipped auto build
measures 3,610 B gzipped) and Bahunya put size in the tagline.

## What users ask for (documented — read from open issues)

1. **Components, tabs above all.** See above.
2. **RTL correctness.** Five open Pico bugs plus two open PRs whose entire
   content is replacing `left`/`right` with logical properties. Nobody in the
   field is RTL-correct by construction.
3. **Layout primitives** — grid, sidebar, footer (new.css, Water).
4. **A manual dark-mode override**, not just `prefers-color-scheme`. Only Pico
   and matcha have one.
5. **`<meter>` and `<progress>`** — the most-commented feature request on Water.
6. **Maintenance.** Pico's "Is this project abandoned?" is the most-commented
   issue in the field. awsm's repo 404s; Water's npm release is from 2021;
   new.css's from 2020; Bahunya last pushed 2023.

## Limits of this survey

- Scoped to eleven widely used libraries. There are dozens of tiny ones, so
  public claims should say "among the most-used classless libraries", not
  "no classless library anywhere".
- awsm.css: its GitHub repo 404s, so findings come only from the npm tarball.
- Bahunya: only `dist/bahunya.min.css` was read; a separate dark build may exist.
- Landing-page taglines were read via fetch-and-summarise; re-verify exact
  wording before quoting any of them publicly.
