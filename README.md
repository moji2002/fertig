# fertig

[![minified size](https://img.shields.io/bundlephobia/min/fertig?label=minified&cacheSeconds=86400)](https://bundlephobia.com/package/fertig)
[![min+gzip size](https://img.shields.io/bundlephobia/minzip/fertig?label=min%2Bgzip&cacheSeconds=86400)](https://bundlephobia.com/package/fertig)

A classless CSS framework for finished interfaces. Link one file and write
semantic HTML; fertig styles the page, forms, tables, dialogs, popovers,
navigation, feedback, and common layout patterns.

**41.1 KB raw · 9.3 KB gzipped · no build step · no dependencies · no JavaScript.**

## Use

```sh
npm install fertig
```

```css
@import "fertig";
```

Or use the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fertig@4/fertig.min.css">
```

That is the complete setup. See the [documentation](https://moji2002.github.io/fertig/docs.html),
[component catalogue](https://moji2002.github.io/fertig/components.html), and
[copy-paste blocks](https://moji2002.github.io/fertig/blocks.html).

## What it includes

- Light and dark themes through `light-dark()`
- Accessible forms, input groups, one-time codes, listboxes, surfaces, cards,
  items, empty states, tabs, menus, dialogs, tooltips, and more
- Native no-JavaScript behavior for popovers, dialogs, drawers, disclosures,
  toasts, and tooltips
- Logical properties for RTL layouts
- OKLCH color ramps and WCAG AA semantic pairs
- A cascade layer, so unlayered project CSS overrides fertig cleanly

Seven component classes are optional: `.row`, `.grid`, `.card`, `.badge`,
`.muted`, `.center`, and `.wide`. Layout utilities are available when semantic
HTML alone cannot express the layout.

## Customize

Override tokens in your own CSS:

```css
:root {
  --fertig-ac: oklch(52% 0.18 270);
  --fertig-r: 10px;
  --fertig-w: 72rem;
}
```

## Development

```sh
npm install
npm run hooks:install # enable automatic patch versioning for commits
npm run build       # regenerate fertig.min.css
npm test            # library and site tests
npm run site        # Astro production build
npm run site:serve  # Astro development server
npm run check       # complete release check
```

The package publishes only `fertig.css`, `fertig.min.css`, this README, and the
MIT license. The Astro site lives in `src/pages`, with its shared shell in
`src/layouts` and `src/components`.

## License

MIT
