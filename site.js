/* site.js — behaviour for fertig's own website.
   NOT part of the library: fertig is a stylesheet and ships no JavaScript.
   Everything here is delegated from the document, so the markup stays free of
   event attributes and the pages work with a strict Content-Security-Policy. */

/* The theme toggle is the one control on the site that needs scripting.
   The site is dark by default and remembers what you picked after that; the
   library itself still follows the OS, which is what a stylesheet should do.
   The initial theme is set by an inline script in the <head> rather than here,
   because a deferred script runs after first paint and you would see a flash
   of the wrong theme. */
addEventListener("click", e => {
  if (!e.target.closest("[data-theme-toggle]")) return;
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("fertig-theme", next); } catch {}
  /* the customiser's contrast readout depends on which theme is showing */
  dispatchEvent(new Event("themechange"));
});

/* Every form here is a demo with nowhere to submit to. */
addEventListener("submit", e => e.preventDefault());

/* highlight.js ships no CSS here on purpose: fertig themes the tokens.
   Blocks that build their own snippets highlight them first and mark them. */
addEventListener("DOMContentLoaded", () => {
  if (!window.hljs) return;
  document.querySelectorAll("pre code:not([data-highlighted])")
    .forEach(el => hljs.highlightElement(el));
});

/* The docs and blocks sidebars mark the section you are actually in. An
   IntersectionObserver rather than a scroll handler: the browser does the
   hit-testing, and it costs nothing while you are not scrolling.
   rootMargin (px only — it rejects rem) pulls the trigger line up under the
   sticky toolbar, so a heading counts as "current" once it reaches the top
   of the reading area. */
addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll('.sidebar a[href^="#"]');
  if (!links.length) return;

  const byId = new Map();
  links.forEach(a => {
    const el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (el) byId.set(el, a);
  });
  if (!byId.size) return;

  let current = null;
  const mark = a => {
    if (a === current) return;
    if (current) current.removeAttribute("aria-current");
    if (a) a.setAttribute("aria-current", "true");
    current = a;
  };

  const seen = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
    /* the topmost section still in view wins, so scrolling up is symmetric */
    const first = [...seen].sort((a, b) =>
      a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    if (first) mark(byId.get(first));
  }, { rootMargin: "-72px 0px -70% 0px", threshold: 0 });

  byId.forEach((_, el) => io.observe(el));
});

/* ---------------------------------------------------------------------------
   The customiser on the homepage. It sets fertig's own tokens on a preview
   element, so what you see is the real sheet reacting to a real override —
   the same three lines you would paste into your own :root.

   The contrast readout exists because an accent is the one token people
   actually change, and it is the one that can quietly break the page for
   somebody. Chrome hands back oklch() verbatim from getComputedStyle and does
   not convert it, so the colour maths is done here rather than read off.
   --------------------------------------------------------------------------- */
addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tune");
  if (!form) return;

  const $ = id => document.getElementById(id);
  const preview = $("t-preview"), out = $("t-css"), verdict = $("t-contrast");

  /* OKLCH -> OKLab -> linear sRGB -> gamma-encoded sRGB */
  const srgb = (L, C, H) => {
    const h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    ].map(v => {
      v = Math.min(1, Math.max(0, v));
      return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
    });
  };
  const lum = ([r, g, b]) => {
    const f = c => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (hi + 0.05) / (lo + 0.05);
  };

  /* fertig ships a different accent per theme, so the controls have to start
     from the one actually in force — otherwise the panel opens in dark mode
     showing the light accent, which genuinely does fail on dark paper. */
  const isDark = () => document.documentElement.dataset.theme === "dark";
  const DEFAULTS = { light: { l: 48, c: 0.095, h: 250 },
                     dark:  { l: 78, c: 0.085, h: 245 } };
  let touched = false;

  const seed = () => {
    const d = DEFAULTS[isDark() ? "dark" : "light"];
    $("t-l").value = d.l; $("t-c").value = d.c; $("t-h").value = d.h;
  };

  const read = () => ({
    l: +$("t-l").value, c: +$("t-c").value, h: +$("t-h").value,
    r: +$("t-r").value, w: +$("t-w").value, f: $("t-f").value,
  });

  const apply = () => {
    const v = read();
    const ac = `oklch(${v.l}% ${v.c} ${v.h})`;

    preview.style.setProperty("--ac", ac);
    preview.style.setProperty("--r", v.r + "px");
    preview.style.setProperty("--w", v.w + "rem");
    v.f ? preview.style.setProperty("--f", v.f)
        : preview.style.removeProperty("--f");

    $("o-l").textContent = v.l + "%";
    $("o-c").textContent = v.c.toFixed(3);
    $("o-h").textContent = v.h;
    $("o-r").textContent = v.r + "px";
    $("o-w").textContent = v.w + "rem";

    const lines = [`  --ac: ${ac};`];
    if (v.r !== 6)  lines.push(`  --r: ${v.r}px;`);
    if (v.w !== 38) lines.push(`  --w: ${v.w}rem;`);
    if (v.f)        lines.push(`  --f: ${v.f};`);
    out.textContent = `:root {\n${lines.join("\n")}\n}`;
    out.removeAttribute("data-highlighted");
    if (window.hljs) hljs.highlightElement(out);

    /* the accent has two jobs: it is link text on the paper, and it is the
       fill under button text. Both have to hold. */
    const dark  = isDark();
    const paper = dark ? srgb(0.21, 0.006, 75) : srgb(0.994, 0.002, 75);
    const onAc  = dark ? srgb(0.07, 0.02, 250) : [255, 255, 255];
    const accent = srgb(v.l / 100, v.c, v.h);

    const onPaper = ratio(accent, paper), onFill = ratio(onAc, accent);
    const worst = Math.min(onPaper, onFill);
    const ok = worst >= 4.5;
    verdict.innerHTML =
      `<span class="badge" data-tone="${ok ? "ok" : "err"}">${ok ? "AA" : "fails AA"}</span> ` +
      `<small class="muted">link on paper ${onPaper.toFixed(2)}:1 · ` +
      `label on the fill ${onFill.toFixed(2)}:1</small>`;
  };

  form.addEventListener("input", () => { touched = true; apply(); });

  /* follow the toggle, but never overwrite an accent someone chose */
  addEventListener("themechange", () => { if (!touched) seed(); apply(); });

  $("t-reset").addEventListener("click", () => {
    form.reset();
    touched = false;
    seed();
    apply();
  });

  $("t-copy").addEventListener("click", async e => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(out.textContent);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Press ⌘C";
      getSelection().selectAllChildren(out);
    }
    setTimeout(() => (btn.textContent = "Copy the CSS"), 1400);
  });

  seed();
  apply();
});
