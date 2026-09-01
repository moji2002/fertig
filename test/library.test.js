const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const css = readFileSync(path.resolve(__dirname, '..', 'fertig.css'), 'utf8');
const rootTokens = css.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? '';
const buttonDefaults = css.match(
  /button, \[type=submit\], \[type=button\], \[type=reset\],[\s\S]*?::file-selector-button \{([\s\S]*?)\n\}/,
)?.[1] ?? '';
const pageShell = css.match(
  /body > \*,\s*body > :where\([^)]*\) > \* \{([^}]*)\}/,
)?.[1] ?? '';
const wideToolbar = css.match(
  /> nav\.wide \{([^}]*)\}/,
)?.[1] ?? '';
const disabledButtonRule = css.match(
  /:is\(button,\[type=submit\],\[type=button\],\[type=reset\]\):disabled \{([^}]*)\}/,
)?.[1] ?? '';

function linearSrgb([lightness, chroma, hue]) {
  const radians = hue * Math.PI / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

function contrast(a, b) {
  const luminance = color => {
    const [r, g, blue] = linearSrgb(color).map(channel => Math.min(1, Math.max(0, channel)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * blue;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test('modern defaults stay opaque and use a shared rounded-control scale', () => {
  assert.doesNotMatch(css, /backdrop-filter|corner-shape|-apple-system|BlinkMacSystemFont/);
  assert.match(css, /--fertig-r:\s*10px/);
  assert.match(css, /border-radius:\s*var\(--fertig-r\)/);
  assert.ok(buttonDefaults, 'missing default button rule');
  assert.match(buttonDefaults, /box-shadow:\s*none/);
  assert.doesNotMatch(buttonDefaults, /translate/);
  assert.doesNotMatch(css, /filled buttons get a lit top edge/);
  assert.equal(
    css.includes(':is(button,[type=submit],[type=button],[type=reset],a.primary,a[role=button]):active'),
    false,
  );
  assert.doesNotMatch(css, /:is\(\[type=submit\], \.primary\)[^{]*\{[^}]*box-shadow/);
  assert.match(rootTokens, /--fertig-fg:\s*light-dark\(oklch\(22% \.02 260\),\s*oklch\(95% \.012 260\)\)/);
  assert.doesNotMatch(rootTokens, /--fertig-fg:[^;]*(?:#000(?:000)?|#fff(?:fff)?)/i);
  assert.doesNotMatch(rootTokens, /--fertig-on-ac:[^;]*(?:#000(?:000)?|#fff(?:fff)?)/i);
});

test('body-level page containers are not width constrained', () => {
  assert.ok(pageShell, 'missing body-level page container rule');
  assert.doesNotMatch(pageShell, /max-width/);
  assert.match(pageShell, /padding-inline:\s*var\(--fertig-g\)/);
});

test('a wide toolbar stays full bleed while its contents use the wide column', () => {
  assert.ok(wideToolbar, 'missing wide toolbar rule');
  assert.match(wideToolbar, /max-width:\s*none/);
  assert.match(wideToolbar, /--fertig-nw:\s*80rem/);
});

test('disabled buttons cannot retain an enabled filled treatment', () => {
  assert.ok(disabledButtonRule, 'missing disabled button override');
  assert.match(disabledButtonRule, /background:\s*var\(--fertig-face\)/);
  assert.match(disabledButtonRule, /border-color:\s*transparent/);
  assert.match(disabledButtonRule, /color:\s*var\(--fertig-mut\)/);
  assert.ok(
    css.indexOf(':is(button,[type=submit],[type=button],[type=reset]):disabled') >
      css.indexOf('[type=submit], .primary'),
    'disabled button treatment must follow and override the filled treatment',
  );
});

test('modern compound primitives use semantic data and ARIA hooks', () => {
  for (const selector of [
    '[data-field]', '[data-input-group]', 'input[data-otp]', '[role=listbox]',
    '[role=option]', '[data-surface]', '[data-item]', '[data-empty]',
  ]) {
    assert.ok(css.includes(selector), `missing ${selector}`);
  }
  assert.match(css, /\[data-input-group\]:focus-within/);
  assert.match(css, /\[role=option\]\[aria-selected=true\]/);
  assert.match(css, /\[data-field\]:has\(\[aria-invalid=true\]\)/);
});

test('the current palette replaces the former ramps and accent names', () => {
  const palette = new Map();

  for (const hue of ['gray', 'blue', 'cyan', 'green', 'amber', 'red', 'violet']) {
    for (const step of [100, 300, 500, 700, 900]) {
      const match = rootTokens.match(new RegExp(
        `--fertig-${hue}-${step}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)\\)`,
      ));
      assert.ok(match, `missing ${hue}-${step}`);
      const value = [Number(match[1]) / 100, Number(match[2]), Number(match[3])];
      palette.set(`${hue}-${step}`, value);
      for (const channel of linearSrgb(value)) {
        assert.ok(channel >= -1e-9 && channel <= 1 + 1e-9, `${hue}-${step} leaves sRGB`);
      }
    }
    assert.match(css, new RegExp(`\\[data-accent=${hue}\\]`));

    const lightAccent = palette.get(`${hue}-700`);
    const darkAccent = palette.get(`${hue}-300`);
    assert.ok(contrast(lightAccent, [0.997, 0.002, 260]) >= 4.5, `${hue} light link fails AA`);
    assert.ok(contrast([0.96, 0, 0], lightAccent) >= 4.5, `${hue} light fill fails AA`);
    assert.ok(contrast(darkAccent, [0.19, 0.016, 260]) >= 4.5, `${hue} dark link fails AA`);
    assert.ok(contrast([0.06, 0, 0], darkAccent) >= 4.5, `${hue} dark fill fails AA`);
  }

  assert.doesNotMatch(rootTokens, /--fertig-(?:stone|sage|sky|clay|plum|gold)-/);
  assert.doesNotMatch(css, /\[data-accent=(?:indigo|sky|sage|clay|plum|gold|slate)\]/);
  assert.match(css, /\[data-tone=ok\][^\n]*--fertig-green-700/);
  assert.match(css, /\[data-tone=warn\][^\n]*--fertig-amber-700/);
  assert.match(css, /\[data-tone=err\][^\n]*--fertig-red-700/);
});
