# Radius scales in current component libraries

Research for fertig 2.x, after the buttons became pills. The question was not
"what number is nice" but: **when buttons are fully rounded, what do the other
surfaces do, and how many radius tokens should a sheet expose?**

Evidence is graded. Two of the three sources below are source code or emitted
CSS (empirical about what those libraries actually ship); the Material claim is
normative (a design system telling you what to do, not a study).

## HeroUI v3 — two scales, forms rounder than surfaces

**Empirical (source code).** HeroUI emits exactly two radius custom properties,
and its defaults make form controls *rounder* than the surfaces around them:

```css
/* Border Radius */
--radius: ${radiusCssMap[variables.radius]};        /* surfaces   */
--field-radius: ${radiusCssMap[variables.formRadius]};  /* controls */
```
<https://github.com/heroui-inc/heroui/blob/v3/apps/docs/src/app/%5Blang%5D/themes/utils/generate-css-variables.ts>

Defaults (`theme-values.ts`): `radius: "medium"`, `formRadius: "large"`.
The id → value map (`constants.ts`):

| id | value |
|---|---|
| none | `0` |
| extra-small | `0.125rem` (2px) |
| small | `0.25rem` (4px) |
| medium | `0.5rem` (8px) |
| large | `0.75rem` (12px) |
| extra-large | `1rem` (16px) — form controls only |

So HeroUI ships **surfaces at 8px, form controls at 12px**. Note the asymmetry
in the options themselves: only the form scale goes up to `extra-large`.
Buttons are not pills by default; `radius="full"` is a per-component opt-in.

## shadcn/ui — one base token, every step derived from it

**Empirical (documented token block).** shadcn exposes a single `--radius:
0.625rem` (10px) and derives the rest with `calc()`:

```css
--radius-sm: calc(var(--radius) * 0.6);
--radius-md: calc(var(--radius) * 0.8);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) * 1.4);
--radius-2xl: calc(var(--radius) * 1.8);
```
<https://ui.shadcn.com/docs/theming>

Their stated reason is that components "use consistent corner sizes while still
sharing a single source of truth". This is the part fertig was getting wrong:
four *independent* radius tokens mean a project that sets `--fertig-r: 4px`
gets tight fields inside cards that are still round.

## Material 3 — pill buttons are the norm, and the surface scale is wide

**Normative (design system doctrine, no study cited).** M3 maps buttons to the
`full` corner style by default — the pill is the default button shape, not a
variant. <https://m3.material.io/components/buttons>

M3's shape scale is much wider than either library above (extra-small 4dp
through extra-large 28dp), and it puts *dialogs* at the top of that range while
text fields sit near the bottom — the exact opposite of HeroUI's ordering.

## What this means for fertig

1. **Pill buttons are mainstream, not a quirk.** M3 ships them by default;
   HeroUI and Radix offer `full` as a first-class option. Keeping the pill
   behind a token (`--fertig-rp`) rather than a hardcoded `999px` matches how
   every library above treats it: a value you can set back.
2. **One base, derived steps.** Adopted from shadcn. `--fertig-r` is the base;
   the small and window radii are `calc()` off it, so a single override
   rescales the whole sheet instead of desynchronising it.
3. **Fields-vs-surfaces ordering is convention, not evidence.** HeroUI makes
   controls rounder than surfaces; M3 does the reverse. Two mature systems
   disagree, so there is nothing to defer to — fertig keeps windows slightly
   rounder than controls (the card has to contain the control) and that choice
   is taste, stated as taste.

*Not researched here:* whether corner radius affects usability at all. The
often-repeated claim that rounded corners are "easier to process" traces to a
2011 blog post and secondhand citations of Bar & Neta's threat-perception work
on *sharp angles in objects*, not on UI corner radii. Treat it as folklore
until someone runs the study.
