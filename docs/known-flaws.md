# Known flaws in fertig

An audit of `fertig.css` v1.0.3 (974 lines), 2026-08-31. This is the adversarial
read: what breaks, what surprises a user, what the README overstates. It is not a
list of things to fix — several entries are deliberate opinions and are marked as
such.

**Evidence grades used below**

- **Verified** — reproduced in Chromium (Playwright) against a probe page on this
  exact file. Computed values quoted.
- **Source** — read directly off the stylesheet; no browser needed to see it.
- **Inference** — my reasoning about consequences, not measured. Treat as a
  hypothesis until reproduced.

---

## Critical

### 1. The whole layout collapses inside a wrapper element

**Verified.** The page shell is `body > *`:

```css
body > * { max-width: var(--w); margin-inline: auto; padding-inline: 1.9rem }
body > header, body > main, body > footer { background: var(--el); border-inline: 1px solid var(--bd) }
```

Every React, Vue, Svelte and Astro app renders into `<div id="root">`. With one
wrapper div in the way, a `<main>` inside it computes to:

| property | expected | actual with `#root` wrapper |
|---|---|---|
| `max-width` | `608px` (38rem) | `none` |
| `background-color` | `--el` (paper) | `rgba(0,0,0,0)` |
| `padding-left` | `30.4px` | `0px` |

So the measure, the paper surface, the hairline borders and the gutters all
disappear — silently, with no error. Typography and controls still work, which
makes the failure look like "fertig just doesn't have a layout" rather than
"your markup is one level too deep". This is the single most likely first
impression a framework user will form.

Mitigations worth considering: accept `body > * > *` as a second shell level,
publish a `:where(body, #root, #app, [data-fertig]) > *` selector, or document a
required `display: contents` on the wrapper. None of these are free — the last
one breaks the sticky nav.

### 2. Every core token dies together in an unsupported browser

**Source + inference.** `--bg`, `--el`, `--face`, `--fg`, `--mut`, `--bd`, `--tb`,
`--ac` are all `light-dark(oklch(…), oklch(…))` with no fallback and no
`@supports` guard. `--sh1`/`--sh2` use relative colour syntax, also unguarded.

In an engine without `light-dark()`, those custom properties are invalid at
computed-value time, so `background: var(--bg)` and `color: var(--fg)` become
`unset` — background transparent, colour inherited. The failure mode is not
"unstyled but readable", it is potentially light text on a light ground. The
floor is roughly Chrome 123 / Safari 17.5 / Firefox 120 (May 2024), which
`docs/browser-support-research.md` already documents honestly; what is missing is
any *graceful* degradation below it. A plain `--fg: #1a1a1a;` line before each
`light-dark()` declaration would cost ~200 bytes and remove the whole class of
failure.

### 3. Unnamespaced `data-*` selectors collide with everything

**Verified.** `[data-size=sm]` is a bare attribute selector. A `<span data-size="sm">`
that has nothing to do with fertig computes `padding: 2.72px 9.52px; font-size:
13.6px` — fertig's small-button styling, applied to unrelated markup.

The same holds for `[data-block]`, `[data-variant]`, `[data-tone]`, `[data-avatar]`,
`[data-skeleton]`, `[data-tooltip]`, `[data-carousel]`, `[data-layout]`,
`[data-side]`, `[data-icon]`, `[data-accent]`. `data-size`, `data-variant` and
`data-block` in particular are extremely common attribute names in component
libraries, analytics tooling and design-system wrappers. A classless sheet is
supposed to be safe to drop onto existing markup; these selectors are the part
that is not. Prefixing them (`data-f-size`) or scoping them to the elements they
are meant for (`button[data-size]`) would fix it without a build step.

### 4. `@property` registers two-character global names

**Source.** `@property --a1` and `--a2` are global registrations — they are not
layered and cannot be overridden or scoped away. Any consumer who already uses
`--a1`/`--a2` for their own purposes now has those properties typed as
`<number>`, and any non-numeric value they assign is dropped silently.

The rest of the token vocabulary has the same problem in softer form: `--f`,
`--w`, `--r`, `--bg`, `--el`, `--ac`, `--sh`, `--dn`, `--up` are among the most
collision-prone names a stylesheet could pick. Short names are pleasant to type
and terrible to share a page with.

---

## Correctness bugs

### 5. `:focus-visible` mutates the element's real geometry

**Verified.** 

```css
:focus-visible { outline: 3px solid …; outline-offset: 1px; border-radius: var(--r) }
```

`border-radius` here is not a ring property — it is the element's own corner
radius. A focused `<dialog>` computes `border-radius: 9px`, not the `14px`
(`--rw`) the sheet gives it unfocused. So dialogs, drawers and the toolbar visibly
change shape the moment they take focus. Outlines already follow the element's
existing `border-radius` in every current engine, so this declaration buys
nothing and costs a visual jump. Same applies to anything focusable whose radius
is not `--r`.

### 6. Inline SVG is forced to `display: block`

**Verified.** `img, svg, video, iframe { display: block }` computes to `block` for
an `<svg>` sitting inside a paragraph, which breaks the line and drops the icon
onto its own row. Icons inside buttons are the common case and they are hit too.
`img` and `video` benefit from `display: block`; `svg` mostly does not.

### 7. Responsive tables lose their table semantics

**Verified.** Below 40rem, `table { display: block; overflow-x: auto }` — the
computed display is `block` at a 500px viewport. Setting a non-table `display` on
a `<table>` removes its implicit `table` role from the accessibility tree in
Chromium, Gecko and WebKit, so a screen-reader user loses row/column association
exactly on the devices where a data table is hardest to read. CSS alone cannot
put the role back (`role="table"` has to be on the element). The usual fix is to
tell authors to wrap tables in a scroll container instead of scrolling the table
itself; that means the sheet cannot do this classlessly, which is the honest
conclusion here.

### 8. Selected tabs vanish in Windows High Contrast

**Source.** `[role=tab][aria-selected=true]` marks selection with
`box-shadow: inset 0 -2px 0 var(--ac)`. The forced-colors layer does
`* { box-shadow: none }` and then tries to restore the cue with
`[role=tab][aria-selected=true] { border-color: Highlight }` — but `[role=tab]`
sets `border: 0`, so there is no border for that colour to land on. Net result in
HCM: no visible selected tab. `border-bottom: 2px solid Highlight` in the a11y
layer would fix it.

### 9. Tabs are styling only

**Source.** The sheet styles `[role=tablist]` / `[role=tab][aria-selected]` but
nothing switches panels — there is no `:checked`-based or `:target`-based
mechanism behind it. Every other "no-JS" component in the sheet (dialog, popover,
drawer, toast, details) really does work without script; tabs are the one that
does not, and the docs present them in the same list. Either wire them to
`:target`/radio inputs or label them "needs ~10 lines of JS" in the component
table.

### 10. Toasts stack on top of each other

**Source.** `[popover][data-toast] { position: fixed; inset: auto 1rem 1rem auto }`
pins every toast to the same corner coordinates. Two open toasts overlap exactly.
A real toast stack needs a container or `anchor-name` chaining; as shipped, the
component only supports one at a time.

### 11. The tooltip is decorative, not accessible

**Source + inference.** `[data-tooltip]::after` renders `attr(data-tooltip)` in a
pseudo-element. Consequences:

- Generated content is not reliably exposed to assistive tech and carries no
  `aria-describedby` relationship, so the text is invisible to screen readers.
- It never appears on touch (`:hover` only, plus `:focus-visible` on focusable
  elements).
- WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) requires the content be
  hoverable and dismissible; a `pointer-events: none` pseudo-element is neither.
- It is clipped by any scroll container, and `[role=group]` sets
  `overflow-x: auto` — so tooltips inside a segmented control are cut off.
- Physical `bottom: 100%; left: 50%` in a sheet that is otherwise scrupulous
  about logical properties.

### 12. `interpolate-size: allow-keywords` is set globally

**Source.** Inside the `details` block the sheet does `:root { interpolate-size:
allow-keywords }`. That is inherited by the entire document and changes how *the
consumer's own* transitions to `height: auto` / `width: auto` behave — animations
that previously snapped now interpolate. It is a page-wide behavioural change made
to enable one component's animation.

### 13. `html { scroll-behavior: smooth }` is imposed on the document

**Source.** Guarded by `prefers-reduced-motion`, which is the right guard, but it
still overrides scroll positioning done by routers and by `scrollTo`, which is a
recurring complaint against every sheet that ships it. `@media` cannot detect
"the author actually wanted this".

### 14. `*` rules with real cost

**Verified / source.** Two universal selectors carry declarations:

- `* { scrollbar-width: thin; scrollbar-color: … }` — computed `thin` on `body`.
  Applies to every scrollable element on the page including ones fertig did not
  style, and narrows scrollbar hit targets, which is a target-size concern for
  motor-impaired users on Firefox and Windows.
- `* { corner-shape: squircle }` under `@supports` — reshapes the consumer's own
  components, not just fertig's, wherever they have a radius.

### 15. The input type list is a maintenance trap

**Source.** The field styling is `input:not([type=checkbox],[type=radio],[type=range],[type=color],[type=file],[type=submit],[type=button],[type=reset])`.
`type=image` is missing, so an image submit button gets full-width block field
treatment with a sunken shadow. Any future input type is opted in by default.

---

## Opinions that will surprise people

These are not bugs. They are choices strong enough that a user dropping fertig on
existing HTML will think something is broken.

- **`<aside>` becomes a callout box** with an accent left border. `<aside>` is the
  complementary landmark — it is what people use for an actual page sidebar, and
  the sidebar will arrive boxed and tinted.
- **`<menu>` becomes a bordered list group.** `<menu>` is spec-equivalent to `<ul>`;
  anyone using it as a semantic list gets an unexpected card.
- **Every `<img>` and `<video>` gets a radius and a drop shadow.** Transparent
  logos and inline icons pick up a shadow around their bounding box.
- **`a[target=_blank]::after` injects "↗"** into every external link, including
  ones wrapping images.
- **`body > footer { display: none }` in print** — legal text, citations and
  contact details are dropped from every printed page.
- **Touch targets force `min-height: 44px`** under `(pointer: coarse)`, including
  on `[data-size=sm]`, so the small variant is not small on phones. Defensible
  under WCAG 2.5.8; still surprising.
- **`--on-ac` only self-corrects where `contrast-color()` exists** (Safari 26 and
  nothing else today). Override `--ac` with a light hue and the white label on
  filled buttons silently fails contrast in every other browser, despite the
  `@supports` block that looks like it handles this.

---

## Documentation drift

**Verified** with `gzip -9`, KB = 1024 bytes, on the working tree as of this audit:

| Build | Claimed raw | Actual raw | Claimed gzip | Actual gzip |
|---|---|---|---|---|
| `fertig.min.css` | 28.7 KB | **29.6 KB** | 7.8 KB | **7.95 KB** |
| `fertig.core.min.css` | 21.8 KB | **22.7 KB** | 6.3 KB | **6.5 KB** |

The same 7.8 KB figure appears in `package.json`'s `description`, `README.md:7`,
`README.md:211` and `README.md:293`. It is stale in all four places, and the
`package.json` copy is the one that shows on the npm page. Whatever the numbers
end up being, they should come out of `build.js` rather than being retyped —
`build.js` already computes them.

Separately, `docs/browser-support-research.md` concludes that the README's
"built only on CSS that shipped in the last two years" claim is **false** — most
required features are 2–4½ years old. That correction has not yet propagated to
`README.md:259`.

---

## What is genuinely good

Worth recording so a future pass does not "fix" it:

- The `@layer fertig, fertig-a11y` ordering, and the reasoning that unlayered
  consumer CSS beats both without `!important`. This is correct and well used.
- The contrast work: the `--mut` lift from 50%/70% to 47%/73% is documented with
  measured ratios, and the accent is measured as link text and as a label on fill,
  in both themes.
- `dl { grid-template-columns: max-content minmax(0, 1fr) }` — the `minmax(0, 1fr)`
  comment about `1fr`'s `min-width: auto` is exactly right and the kind of thing
  most sheets get wrong.
- `.flex-1 { flex: 1; min-width: 0 }` for the same reason.
- Popover anchoring deliberately *not* scoped to `:popover-open`, with the
  reasoning about the closing frame written down. That is a real bug someone
  already hit and fixed.
- The forced-colors layer existing at all.
