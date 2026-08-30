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
