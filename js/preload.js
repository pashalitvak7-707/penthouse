/* ===========================================================================
   The Penthouse — preloader
   ---------------------------------------------------------------------------
   Shows a loading screen that reveals "The Penthouse Residence" letter by
   letter over a progress bar whose percentage tracks the ACTUAL byte download
   of every video and image. When all assets are in (cache warmed), it fades
   out and dispatches `penthouse:ready` so main.js can load the real elements
   from cache instead of downloading everything a second time.
   =========================================================================== */

(function () {
  'use strict';

  var docEl = document.documentElement;
  var pre = document.getElementById('preloader');
  var C = window.TOUR_CONFIG || {};

  function markReady() {
    window.__PENTHOUSE_READY = true;
    window.dispatchEvent(new Event('penthouse:ready'));
  }

  // If there's no preloader (or no JS-config), just let the page through.
  if (!pre) { docEl.classList.remove('is-loading'); markReady(); return; }

  // ---- build the letter-by-letter title -----------------------------------
  var titleEl = pre.querySelector('.preloader__title');
  var titleText = (C.intro && C.intro.title) || 'The Penthouse Residence';
  var li = 0;
  titleText.split(' ').forEach(function (word, wi, arr) {
    var w = document.createElement('span');
    w.className = 'pl-word';
    word.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'pl-ch';
      s.textContent = ch;
      s.style.setProperty('--i', li++);
      w.appendChild(s);
    });
    titleEl.appendChild(w);
    if (wi < arr.length - 1) titleEl.appendChild(document.createTextNode(' '));
  });

  var barEl = pre.querySelector('.preloader__bar');
  var pctEl = pre.querySelector('.preloader__pct');

  // ---- collect every asset to preload --------------------------------------
  var urls = [];
  (C.scenes || []).forEach(function (s) {
    if (s.src) urls.push(s.src);
    if (s.fromVideo) urls.push(s.fromVideo);
    if (s.toVideo) urls.push(s.toVideo);
  });
  urls.push('assets/images/hero.png');
  (C.rooms || []).forEach(function (r) { if (r.image) urls.push(r.image); });
  urls = urls.filter(function (u, i) { return urls.indexOf(u) === i; }); // dedupe

  // ---- smooth percentage counter -------------------------------------------
  var realPct = 0, shown = 0, finished = false;
  (function tick() {
    shown += (realPct - shown) * 0.12;
    if (realPct >= 100 && shown > 99.4) shown = 100;
    var v = Math.min(100, Math.round(shown));
    pctEl.textContent = v + '%';
    barEl.style.width = v + '%';
    if (shown < 100) requestAnimationFrame(tick);
  })();

  function reveal() {
    if (finished) return;
    finished = true;
    realPct = 100;
    // let the counter hit 100 and the letters settle, then lift the curtain
    setTimeout(function () {
      pre.classList.add('is-done');
      docEl.classList.remove('is-loading');
      markReady();
      var rm = function () { if (pre && pre.parentNode) pre.parentNode.removeChild(pre); };
      pre.addEventListener('transitionend', rm, { once: true });
      setTimeout(rm, 1300);
    }, 650);
  }

  // ---- load with real byte progress, with graceful fallbacks ---------------
  function canStream() {
    try { return !!window.fetch && !!(new Response(new ReadableStream()).body); }
    catch (e) { return false; }
  }

  if (canStream()) {
    var sizes = new Array(urls.length).fill(0);
    var loaded = new Array(urls.length).fill(0);

    // HEAD first to learn sizes for a stable denominator (best-effort)
    Promise.all(urls.map(function (u, i) {
      return fetch(u, { method: 'HEAD' })
        .then(function (r) { sizes[i] = parseInt(r.headers.get('content-length') || '0', 10) || 0; })
        .catch(function () { sizes[i] = 0; });
    })).then(function () {
      var NOMINAL = 800000; // weight for assets with unknown size
      var totals = sizes.map(function (s) { return s > 0 ? s : NOMINAL; });
      var grand = totals.reduce(function (a, b) { return a + b; }, 0) || 1;

      function recompute() {
        var got = 0;
        for (var i = 0; i < urls.length; i++) got += Math.min(loaded[i], totals[i]);
        realPct = Math.min(99.5, (got / grand) * 100);
      }

      var pending = urls.length;
      function oneDone(i) { loaded[i] = totals[i]; recompute(); if (--pending <= 0) reveal(); }

      urls.forEach(function (u, i) {
        fetch(u).then(function (resp) {
          if (!resp.body || !resp.body.getReader) { oneDone(i); return; }
          var reader = resp.body.getReader();
          (function read() {
            reader.read().then(function (res) {
              if (res.done) { oneDone(i); return; }
              loaded[i] += res.value.length; recompute(); read();
            }).catch(function () { oneDone(i); });
          })();
        }).catch(function () { oneDone(i); });
      });
    });
  } else {
    // fallback: count load events (coarse percentage)
    var done = 0;
    function bump() { done++; realPct = Math.min(99.5, (done / urls.length) * 100); if (done >= urls.length) reveal(); }
    urls.forEach(function (u) {
      if (/\.(mp4|webm|mov)$/i.test(u)) {
        var vid = document.createElement('video');
        vid.preload = 'auto'; vid.muted = true;
        vid.onloadeddata = bump; vid.onerror = bump; vid.src = u;
      } else {
        var img = new Image(); img.onload = bump; img.onerror = bump; img.src = u;
      }
    });
  }

  // ultimate safety net: never trap the visitor behind the loader
  setTimeout(reveal, 45000);
})();
