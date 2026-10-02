/* MathJax configuration — must be loaded BEFORE assets/vendor/mathjax/tex-svg.js
   SVG output is used so that equations render offline with no web-font files.
   Copyright (c) 2026 Jedsada Saijai. */
window.MathJax = {
  tex: {
    /* Only the backslash delimiters are enabled, so a stray "$" in the prose
       (prices, currency) is never mistaken for the start of an equation. */
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    tags: 'none',
    macros: {
      // Common electrical-engineering shorthands used across the chapters
      ud: ['\\,\\mathrm{#1}', 1],          // \ud{V} -> upright unit
      vpp: '\\mathrm{V_{p\\text{-}p}}',
      rms: '_{\\mathrm{rms}}',
      degC: '^{\\circ}\\mathrm{C}',
      ang: ['\\angle #1^{\\circ}', 1],     // \ang{30} -> phasor angle
      j: '\\mathrm{j}'
    }
  },
  svg: { fontCache: 'global', scale: 1.02 },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    ignoreHtmlClass: 'no-mathjax'
  },
  startup: {
    ready: function () {
      window.MathJax.startup.defaultReady();
      window.MathJax.startup.promise.then(function () {
        document.documentElement.classList.add('mathjax-ready');
        document.querySelectorAll('.math-fallback').forEach(function (el) {
          el.hidden = true;
        });
      });
    }
  }
};
