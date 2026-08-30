/* site.js — behaviour for fertig's own website.
   NOT part of the library: fertig is a stylesheet and ships no JavaScript.
   Everything here is delegated from the document, so the markup stays free of
   event attributes and the pages work with a strict Content-Security-Policy. */

/* The theme toggle is the one control on the site that needs scripting. */
addEventListener("click", e => {
  if (!e.target.closest("[data-theme-toggle]")) return;
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
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
