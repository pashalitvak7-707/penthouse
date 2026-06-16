/* ===========================================================================
   The Penthouse — continuous scroll engine
   ---------------------------------------------------------------------------
   ONE stage is pinned for the whole tour and a single timeline runs through it.
   As you scroll, the active clip is scrubbed; the instant it reaches its last
   frame the next clip takes over on its first frame. Because the clips are
   authored so each starts where the previous ended, the handoff is seamless —
   no jump, no dead scroll between transitions.

     - "video" scenes : scrub video.currentTime to the scene's progress
     - "blur"  scenes : push in on the "from" frame (mirror wall), then blur +
                        cross-fade into the "to" frame
   No dependencies, no build step.
   =========================================================================== */

(function () {
  'use strict';

  var CONFIG = window.TOUR_CONFIG;
  if (!CONFIG) { console.error('TOUR_CONFIG missing'); return; }

  // Defer heavy downloads until the preloader has warmed the cache, so assets
  // aren't fetched twice. Falls back to running immediately if no preloader.
  function whenReady(cb) {
    var fired = false;
    var run = function () { if (fired) return; fired = true; cb(); };
    if (window.__PENTHOUSE_READY || !document.getElementById('preloader')) return run();
    window.addEventListener('penthouse:ready', run, { once: true });
    setTimeout(run, 47000); // ultimate fallback
  }

  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  function ramp(x, a, b) { // smoothstep 0..1 between a and b
    if (a === b) return x < a ? 0 : 1;
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  var tour = document.getElementById('tour');
  var dotsNav = document.querySelector('.dots');

  // intro / outro text
  setText('.hero__title', CONFIG.intro.title);
  setText('.hero__subtitle', CONFIG.intro.subtitle);
  setText('.outro__title', CONFIG.outro.title);
  setText('.outro__copy', CONFIG.outro.copy);

  // ---- build the single pinned stage --------------------------------------
  var stage = document.createElement('div');
  stage.className = 'stage';
  tour.appendChild(stage);

  var scenes = [];
  var accLen = 0; // running total of scene lengths (in viewport units)

  CONFIG.scenes.forEach(function (cfg, i) {
    var media = document.createElement('div');
    media.className = 'scene-media';
    media.style.setProperty('--accent', cfg.accent || '#222');

    var refs = {};

    if (cfg.type === 'blur') {
      var fromV = makeVideo(cfg.fromVideo);
      var toV = makeVideo(cfg.toVideo);
      fromV.className = 'scene__layer scene__layer--from';
      toV.className = 'scene__layer scene__layer--to';
      if (cfg.focus) fromV.style.transformOrigin = cfg.focus;
      media.appendChild(fromV);
      media.appendChild(toV);
      refs.from = fromV;
      refs.to = toV;
      // park "from" on its last frame, "to" on its first frame
      onReady(fromV, function () { seekTo(fromV, Math.max(0, fromV.duration - 0.05)); });
      onReady(toV, function () { seekTo(toV, 0); });
    } else {
      var v = makeVideo(cfg.src);
      v.className = 'scene__video';
      // optional static reframe so adjacent clips line up at the cut
      if (cfg.focus) v.style.transformOrigin = cfg.focus;
      if (cfg.scale != null) v.style.transform = 'scale(' + cfg.scale + ')';
      media.appendChild(v);
      refs.video = v;
      onReady(v, function () { seekTo(v, 0); }); // pre-seat on first frame
    }

    var scrim = document.createElement('div');
    scrim.className = 'scene__scrim';
    media.appendChild(scrim);

    var content = document.createElement('div');
    content.className = 'scene__content';
    content.innerHTML =
      '<span class="scene__eyebrow"></span>' +
      '<h2 class="scene__title"></h2>' +
      '<p class="scene__copy"></p>';
    content.querySelector('.scene__eyebrow').textContent = pad(i + 1) + ' · ' + cfg.label;
    content.querySelector('.scene__title').textContent = cfg.heading;
    content.querySelector('.scene__copy').textContent = cfg.copy;
    media.appendChild(content);

    stage.appendChild(media);

    // nav dot
    var dot = document.createElement('button');
    dot.className = 'dot';
    dot.style.setProperty('--c', cfg.accent || '#fff');
    dot.innerHTML = '<span class="dot__label">' + cfg.label + '</span>';
    var startUnits = accLen;
    dot.addEventListener('click', function () {
      var target = tour.offsetTop + (startUnits + 0.02) * vh;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
    dotsNav.appendChild(dot);

    scenes.push({
      cfg: cfg, type: cfg.type, media: media, content: content, refs: refs,
      start: accLen, len: cfg.length || 1.6, dot: dot,
    });
    accLen += cfg.length || 1.6;
  });

  var totalUnits = accLen; // total scrub distance in viewport units

  // ---- room gallery: auto-playing crossfade showcase with manual control --
  var roomsEl = document.getElementById('rooms');
  if (roomsEl && Array.isArray(CONFIG.rooms) && CONFIG.rooms.length) {
    buildGallery(roomsEl, CONFIG.rooms);
  }

  function buildGallery(root, rooms) {
    var n = rooms.length;
    var AUTOPLAY = 5200;   // ms each room is shown
    var index = 0, timer = null, inView = false;

    // layered images (crossfade + Ken Burns)
    var stage = el('div', 'gallery__stage');
    var slides = rooms.map(function (r) {
      var s = el('div', 'gallery__slide');
      var img = el('div', 'gallery__img');
      // assign the background only once the preloader has cached it
      whenReady(function () { img.style.backgroundImage = 'url("' + r.image + '")'; });
      s.appendChild(img);
      stage.appendChild(s);
      return s;
    });
    root.appendChild(stage);
    root.appendChild(el('div', 'scene__scrim'));

    // text block (crossfaded on change)
    var content = el('div', 'gallery__content');
    content.innerHTML =
      '<span class="gallery__count"></span>' +
      '<span class="scene__eyebrow"></span>' +
      '<h2 class="scene__title"></h2>' +
      '<p class="scene__copy"></p>';
    root.appendChild(content);
    var elCount = content.querySelector('.gallery__count');
    var elEye = content.querySelector('.scene__eyebrow');
    var elTitle = content.querySelector('.scene__title');
    var elCopy = content.querySelector('.scene__copy');

    // controls: arrows + segmented progress bars
    var prev = el('button', 'gallery__arrow gallery__arrow--prev');
    prev.setAttribute('aria-label', 'Previous room');
    prev.innerHTML = chevron('left');
    var next = el('button', 'gallery__arrow gallery__arrow--next');
    next.setAttribute('aria-label', 'Next room');
    next.innerHTML = chevron('right');
    root.appendChild(prev); root.appendChild(next);

    var bars = el('div', 'gallery__bars');
    var fills = rooms.map(function (r, i) {
      var b = el('button', 'gallery__bar');
      b.setAttribute('aria-label', r.heading);
      var f = el('span', 'gallery__bar-fill');
      b.appendChild(f);
      b.addEventListener('click', function () { go(i); });
      bars.appendChild(b);
      return f;
    });
    root.appendChild(bars);

    function fillContent(r) {
      elCount.textContent = pad(index + 1) + ' / ' + pad(n);
      elEye.textContent = r.label;
      elTitle.textContent = r.heading;
      elCopy.textContent = r.copy;
    }

    function go(to) {
      to = (to % n + n) % n;
      var changed = to !== index || elTitle.textContent === '';
      index = to;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === index); });
      fills.forEach(function (f, k) {
        f.parentNode.classList.toggle('is-done', k < index);
        f.parentNode.classList.toggle('is-active', k === index);
        if (k !== index) { f.style.animation = 'none'; } // reset non-active fills
      });
      if (changed) {
        content.classList.add('is-out');
        setTimeout(function () { fillContent(rooms[index]); content.classList.remove('is-out'); }, 320);
      }
      restart();
    }

    // restart the active progress bar + the autoplay timer
    function restart() {
      var f = fills[index];
      f.style.animation = 'none';
      void f.offsetWidth;                       // force reflow to replay
      f.style.animation = 'barFill ' + AUTOPLAY + 'ms linear forwards';
      f.style.animationPlayState = (inView && !root.classList.contains('is-paused')) ? 'running' : 'paused';
      clearTimeout(timer);
      if (inView && !root.classList.contains('is-paused')) {
        timer = setTimeout(function () { go(index + 1); }, AUTOPLAY);
      }
    }

    function pause() {
      root.classList.add('is-paused');
      clearTimeout(timer);
      if (fills[index]) fills[index].style.animationPlayState = 'paused';
    }
    function resume() {
      if (!root.classList.contains('is-paused')) return;
      root.classList.remove('is-paused');
      go(index); // re-sync bar + timer from the current room
    }

    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    document.addEventListener('keydown', function (e) {
      if (!inView) return;
      if (e.key === 'ArrowRight') { go(index + 1); }
      else if (e.key === 'ArrowLeft') { go(index - 1); }
    });

    // start/stop with visibility so it doesn't run off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          inView = e.isIntersecting && e.intersectionRatio > 0.45;
          if (inView) { root.classList.remove('is-paused'); go(index); }
          else { clearTimeout(timer); }
        });
      }, { threshold: [0, 0.45, 0.8] }).observe(root);
    } else {
      inView = true;
    }

    fillContent(rooms[0]);
    go(0);
  }

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function chevron(dir) {
    var d = dir === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19';
    return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" ' +
      'stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + d + '"/></svg>';
  }


  // size the tour so the stage stays pinned for exactly `totalUnits` viewports
  function layout() {
    tour.style.height = (totalUnits + 1) * vh + 'px';
  }

  // ---- scroll loop --------------------------------------------------------
  var vh = window.innerHeight;
  var ticking = false;
  var activeIndex = -1;

  function onScrollOrResize() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function update() {
    ticking = false;
    var scrollY = window.scrollY || window.pageYOffset;

    // doc-wide progress bar
    var docMax = document.body.scrollHeight - vh || 1;
    setBarWidth(clamp(scrollY / docMax, 0, 1) * 100);
    // dots cover the video tour only; hide them over the hero and the gallery
    var roomsTop = roomsEl ? roomsEl.offsetTop : Infinity;
    dotsNav.classList.toggle('is-visible', scrollY > vh * 0.55 && scrollY < roomsTop - vh * 0.5);

    // position along the pinned timeline, in viewport units
    var local = (scrollY - tour.offsetTop) / vh;        // 0 .. totalUnits
    local = clamp(local, 0, totalUnits);

    // which scene are we in?
    var idx = 0;
    for (var i = 0; i < scenes.length; i++) {
      if (local >= scenes[i].start) idx = i; else break;
    }
    var s = scenes[idx];
    var p = clamp((local - s.start) / s.len, 0, 1);

    if (idx !== activeIndex) {
      for (var k = 0; k < scenes.length; k++) {
        scenes[k].media.classList.toggle('is-active', k === idx);
        scenes[k].dot.classList.toggle('is-active', k === idx);
      }
      activeIndex = idx;
    }

    if (s.type === 'blur') driveBlur(s, p); else driveVideo(s, p);

    // text: in 0.06..0.26, hold, out 0.80..0.97
    var reveal = ramp(p, 0.06, 0.26) * (1 - ramp(p, 0.80, 0.97));
    s.content.style.setProperty('--reveal', reveal.toFixed(3));
  }

  function driveVideo(s, p) {
    var v = s.refs.video;
    if (!v || !v.duration || isNaN(v.duration)) return;
    var t = p * (v.duration - 0.02);
    if (Math.abs(v.currentTime - t) > 0.015) seekTo(v, t);
  }

  // blur scene: push in on "from" (mirror wall), then blur + cross-fade to "to"
  function driveBlur(s, p) {
    var MAX = 26;                                   // px blur at the dissolve
    var ZOOM = s.cfg.zoom != null ? s.cfg.zoom : 0.16;
    var from = s.refs.from, to = s.refs.to;

    // 0.0 .. ~0.5 : sharp push-in on the mirror wall
    // 0.4 .. 1.0  : blur both and cross-fade into the bedroom
    var fromScale = 1 + ramp(p, 0, 0.7) * ZOOM;
    var fromBlur = ramp(p, 0.42, 0.92) * MAX;
    var fromOpacity = 1 - ramp(p, 0.5, 0.96);

    var toBase = s.cfg.toScale || 1;            // crop to hide the clip's baked border
    var toScale = (toBase + ZOOM * 0.5) - ramp(p, 0.45, 1) * (ZOOM * 0.5);
    var toBlur = (1 - ramp(p, 0.55, 1)) * MAX;
    var toOpacity = ramp(p, 0.48, 0.9);

    from.style.opacity = fromOpacity.toFixed(3);
    from.style.filter = 'blur(' + fromBlur.toFixed(1) + 'px)';
    from.style.transform = 'scale(' + fromScale.toFixed(3) + ')';

    to.style.opacity = toOpacity.toFixed(3);
    to.style.filter = 'blur(' + toBlur.toFixed(1) + 'px)';
    to.style.transform = 'scale(' + toScale.toFixed(3) + ')';
  }

  // ---- helpers ------------------------------------------------------------
  function makeVideo(src) {
    var v = document.createElement('video');
    v.muted = true; v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'none';            // hold off until the preloader is done
    v.loop = false;
    var source = document.createElement('source');
    source.src = src; source.type = 'video/mp4';
    v.appendChild(source);
    whenReady(function () { v.preload = 'auto'; v.load(); });
    return v;
  }

  function onReady(v, fn) {
    if (v.readyState >= 1 && v.duration) fn();
    else v.addEventListener('loadedmetadata', fn, { once: true });
  }

  // seek to t, queueing the latest target if a seek is already in flight
  function seekTo(v, t) {
    t = clamp(t, 0, (v.duration || 0));
    if (v.seeking) { v._pending = t; return; }
    v.currentTime = t;
    if (!v._wired) {
      v._wired = true;
      v.addEventListener('seeked', function () {
        if (v._pending != null) {
          var n = v._pending; v._pending = null;
          if (Math.abs(v.currentTime - n) > 0.015) v.currentTime = n;
        }
      });
    }
  }

  function setText(sel, txt) { var el = document.querySelector(sel); if (el) el.textContent = txt; }
  function setBarWidth(pct) { var b = document.querySelector('.progress__bar'); if (b) b.style.width = pct + '%'; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // ---- init ---------------------------------------------------------------
  layout();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; layout(); onScrollOrResize(); });
  window.addEventListener('load', function () { layout(); update(); });
  update();
})();
