/* site.js — behaviour for fertig's own website.
   NOT part of the library: fertig is a stylesheet and ships no JavaScript.
   Everything here is delegated from the document, so the markup stays free of
   event attributes and the pages work with a strict Content-Security-Policy. */

/* Which theme is actually showing. Both the showcase and the customiser
   need it, and the answer is the attribute, not the OS preference. */
const isDarkTheme = () => document.documentElement.dataset.theme === "dark";

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
  /* Transitions are cut for the frame the scheme flips in. A transitioned
     `color` whose value comes from light-dark() holds the branch it started
     on when the flip is a color-scheme change: measured on the nav, the links
     stayed on the light branch (2.06:1 on the dark bar) until the transition
     was taken out of the picture, at which point they resolved correctly. */
  root.dataset.themeSwitching = "";
  root.dataset.theme = next;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    delete root.dataset.themeSwitching;
  }));
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
   sticky toolbar, so a heading counts as "current" once it reaches the top of
   the reading area. It is deliberately shorter than the sections'
   scroll-margin-top of 72px: matching it exactly puts a jumped-to heading
   right on the boundary, where sub-pixel rounding decides whether it counts,
   and the section above gets marked instead. */
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

  /* The current section is the last one whose top has passed the trigger line —
     not the topmost one still on screen. A section you have scrolled past has a
     negative top, so "topmost visible" always picks the one above the one you
     are actually reading. The observer is only a cheap trigger; the decision is
     this comparison, which is what makes clicking a link mark the right entry. */
  const LINE = 80;
  const pick = () => {
    let current = null;
    byId.forEach((link, el) => {              // Map keeps document order
      if (el.getBoundingClientRect().top <= LINE) current = link;
    });
    mark(current || byId.values().next().value);
  };

  const io = new IntersectionObserver(pick, {
    rootMargin: "0px 0px -40% 0px", threshold: [0, 1],
  });
  /* an anchor jump can land without changing what intersects, so listen to
     scrolling too — throttled to one check per frame, since the work is a
     read of every section's box */
  let queued = false;
  addEventListener("scroll", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; pick(); });
  }, { passive: true });

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
  const DEFAULTS = { light: { l: 50, c: 0.19, h: 275 },
                     dark:  { l: 78, c: 0.11, h: 275 } };
  let touched = false;

  const seed = () => {
    const d = DEFAULTS[isDarkTheme() ? "dark" : "light"];
    $("t-l").value = d.l; $("t-c").value = d.c; $("t-h").value = d.h;
  };

  const read = () => ({
    l: +$("t-l").value, c: +$("t-c").value, h: +$("t-h").value,
    r: +$("t-r").value, w: +$("t-w").value, f: $("t-f").value,
  });

  const apply = () => {
    const v = read();
    const ac = `oklch(${v.l}% ${v.c} ${v.h})`;

    /* the token names carry the fertig- prefix since 2.0.0; the short aliases
       these once set are gone, and setting them changed nothing at all. */
    preview.style.setProperty("--fertig-ac", ac);
    /* --fertig-rs and --fertig-rw are calc()ed off --fertig-r where the sheet
       declares them, on :root. This preview overrides the token halfway down
       the tree, where that derivation has already resolved, so the cards would
       keep the default radius while the fields moved. Set all three. */
    preview.style.setProperty("--fertig-r", v.r + "px");
    preview.style.setProperty("--fertig-rs", (v.r * 0.5) + "px");
    preview.style.setProperty("--fertig-rw", (v.r * 1.33) + "px");
    preview.style.setProperty("--fertig-rp", (v.r * 1000) + "px");
    preview.style.setProperty("--fertig-w", v.w + "rem");
    v.f ? preview.style.setProperty("--fertig-f", v.f)
        : preview.style.removeProperty("--fertig-f");

    $("o-l").textContent = v.l + "%";
    $("o-c").textContent = v.c.toFixed(3);
    $("o-h").textContent = v.h;
    $("o-r").textContent = v.r + "px";
    $("o-w").textContent = v.w + "rem";

    const lines = [`  --fertig-ac: ${ac};`];
    if (v.r !== 12) lines.push(`  --fertig-r: ${v.r}px;`);
    if (v.w !== 72) lines.push(`  --fertig-w: ${v.w}rem;`);
    if (v.f)        lines.push(`  --fertig-f: ${v.f};`);
    out.textContent = `:root {\n${lines.join("\n")}\n}`;
    out.removeAttribute("data-highlighted");
    if (window.hljs) hljs.highlightElement(out);

    /* the accent has two jobs: it is link text on the paper, and it is the
       fill under button text. Both have to hold. */
    const dark  = isDarkTheme();
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

/* The docs and blocks sidebar is a <details>. It ships open, so it works with
   no JavaScript at any width — but open-by-default on a phone means scrolling
   past the whole section list to reach the content. Collapse it there, and
   keep it in step if the window is resized across the breakpoint. */
addEventListener("DOMContentLoaded", () => {
  const panel = document.querySelector(".sidebar details");
  if (!panel) return;
  const wide = matchMedia("(width >= 60rem)");
  const sync = () => { panel.open = wide.matches };
  wide.addEventListener("change", sync);
  sync();
});

/* The showcase under the hero: real components, restyled live.
   Tabs swap which set is on stage; the colour dots set data-accent on the stage,
   so you are looking at the actual sheet reacting to the one token people
   change, not at a picture of it. */
addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const tabs = [...document.querySelectorAll('.showcase-bar [role=tab]')];
  const show = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach(t => t.addEventListener("click", () => show(t)));

  /* left/right arrows move between tabs, which is what a tablist promises */
  tabs.forEach((t, i) => t.addEventListener("keydown", e => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(i + step + tabs.length) % tabs.length];
    show(next);
    next.focus();
  }));

  /* The dots carry data-accent themselves, so CSS paints each one with the
     accent it represents — no colour is restated in JavaScript, and the swatch
     cannot drift from what the sheet actually does. Clicking copies that
     attribute onto the stage, which is exactly what you would write by hand. */
  const dots = [...document.querySelectorAll("#accent-dots button")];
  dots.forEach(d => d.addEventListener("click", () => {
    dots.forEach(o => o.setAttribute("aria-pressed", String(o === d)));
    stage.dataset.accent = d.dataset.accent;
  }));
  stage.dataset.accent = dots[0].dataset.accent;

});
