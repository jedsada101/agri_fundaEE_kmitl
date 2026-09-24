/* ============================================================================
   Fundamental of Electrical Engineering — site behaviour
   Language switch (TH/EN), mobile nav, TOC scroll-spy, progress marking.
   Works from file:// — no fetch(), no external dependency.
   Copyright (c) 2026 Jedsada Saijai. All rights reserved.
   ========================================================================== */
(function () {
  'use strict';

  var LANG_KEY = 'fee.lang';
  var PROGRESS_KEY = 'fee.progress';
  /* Must match the collapsed-menu breakpoint in style.css */
  var NAV_BREAKPOINT = 1109;

  /* ------------------------------------------------------------- storage */
  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode / file:// restrictions — ignore */ }
    return null;
  }

  /* ------------------------------------------------------------ language */
  function currentLang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'th';
  }

  function setLang(lang) {
    lang = (lang === 'en') ? 'en' : 'th';
    document.documentElement.setAttribute('lang', lang);
    store(LANG_KEY, lang);
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    // Elements whose *attribute* text must follow the language
    document.querySelectorAll('[data-th][data-en]').forEach(function (el) {
      var txt = lang === 'en' ? el.dataset.en : el.dataset.th;
      if (el.placeholder !== undefined && el.tagName === 'INPUT') el.placeholder = txt;
      else el.textContent = txt;
    });
    document.querySelectorAll('[data-title-th][data-title-en]').forEach(function (el) {
      el.setAttribute('title', lang === 'en' ? el.dataset.titleEn : el.dataset.titleTh);
    });
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.FEE = window.FEE || {};
  window.FEE.lang = currentLang;
  window.FEE.setLang = setLang;
  window.FEE.t = function (th, en) { return currentLang() === 'en' ? en : th; };

  /* ---------------------------------------------------------------- init */
  function init() {
    // Language buttons
    document.querySelectorAll('.lang-switch button').forEach(function (btn) {
      btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
    });
    setLang(store(LANG_KEY) || currentLang());

    // Mobile navigation
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      var close = function () {
        links.dataset.open = 'false';
        toggle.setAttribute('aria-expanded', 'false');
      };
      var apply = function () {
        if (window.innerWidth > NAV_BREAKPOINT) { links.removeAttribute('data-open'); }
        else if (!links.dataset.open) { close(); }
      };
      toggle.addEventListener('click', function () {
        var open = links.dataset.open === 'true';
        links.dataset.open = String(!open);
        toggle.setAttribute('aria-expanded', String(!open));
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && window.innerWidth <= NAV_BREAKPOINT) close();
      });
      window.addEventListener('resize', apply);
      apply();
    }

    initStickyNav();
    initAnimToggles();
    initTOC();
    markVisited();
    paintProgress();
  }

  /* --------------------------------------------------------- sticky nav */
  /* The navbar is a dark bar floating over the hero. Once the page scrolls,
     the strip behind it fills in so page content cannot show through.      */
  function initStickyNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var queued = false;
    var apply = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 12);
    };
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { apply(); queued = false; });
    }, { passive: true });
    apply();
  }

  /* ------------------------------------------- animated figure controls */
  function initAnimToggles() {
    document.querySelectorAll('[data-anim-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = btn.closest('[data-anim]');
        if (!box) return;
        var running = box.dataset.anim !== 'paused';
        box.dataset.anim = running ? 'paused' : 'running';
        btn.setAttribute('aria-pressed', String(running));
      });
    });
  }

  /* ------------------------------------------------------- TOC scroll-spy */
  function initTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var targets = links.map(function (a) {
      return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    });

    var tick = function () {
      var line = window.scrollY + 140;
      var index = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].offsetTop <= line) index = i;
      }
      links.forEach(function (a, i) { a.classList.toggle('active', i === index); });
    };

    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { tick(); queued = false; });
    }, { passive: true });
    tick();
  }

  /* -------------------------------------------------------- progress bits */
  function readProgress() {
    try { return JSON.parse(store(PROGRESS_KEY) || '{}'); } catch (e) { return {}; }
  }

  function writeProgress(p) { store(PROGRESS_KEY, JSON.stringify(p)); }

  window.FEE.saveScore = function (chapter, kind, score, total) {
    if (!chapter) return;
    var p = readProgress();
    p[chapter] = p[chapter] || {};
    p[chapter][kind] = { score: score, total: total, at: new Date().toISOString().slice(0, 10) };
    writeProgress(p);
  };

  function markVisited() {
    var ch = document.body.dataset.chapter;
    if (!ch) return;
    var p = readProgress();
    p[ch] = p[ch] || {};
    p[ch].visited = true;
    writeProgress(p);
  }

  /* Index page: show which chapters were opened / tested */
  function paintProgress() {
    var cards = document.querySelectorAll('[data-chapter-card]');
    if (!cards.length) return;
    var p = readProgress();
    cards.forEach(function (card) {
      var rec = p[card.dataset.chapterCard];
      var slot = card.querySelector('[data-progress-slot]');
      if (!rec || !slot) return;
      var post = rec.post;
      if (post) {
        slot.innerHTML = '<span class="badge badge-ok">Post-test ' + post.score + '/' + post.total + '</span>';
      } else if (rec.visited) {
        slot.innerHTML = '<span class="badge">' +
          '<span class="th">เปิดอ่านแล้ว</span><span class="en">Opened</span></span>';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
