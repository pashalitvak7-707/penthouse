/* ===========================================================================
   The Penthouse — scroll engine
   ---------------------------------------------------------------------------
   Builds the tour from window.TOUR_CONFIG and drives it from scroll position:
     - "video" scenes  : scrub video.currentTime to the scroll progress
     - "blur"  scenes  : blur + cross-fade between two held video frames
     - text            : reveals/recedes as each scene enters/leaves
   No dependencies, no build step.
   =========================================================================== */

(function () {
  'use strict';

  var CONFIG = window.TOUR_CONFIG;
  if (!CONFIG) { console.error('TOUR_CONFIG missing'); return; }

  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };

  // smooth 0..1 ramp between edges a and b
  function ramp(x, a, b) {
    if (a === b) return x < a ? 0 : 1;
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t); // smoothstep
  }

  // ---- build DOM ----------------------------------------------------------
  var tour = document.getElementById('tour');
  var dotsNav = document.querySelector('.dots');
  var sceneObjs = [];

  // intro / outro text
  setText('.hero__kicker', CONFIG.intro.kicker);
  setText('.hero__title', CONFIG.intro.title);
  setText('.hero__subtitle', CONFIG.intro.subtitle);
  setText('.outro__title', CONFIG.outro.title);
  setText('.outro__copy', CONFIG.outro.copy);

  CONFIG.scenes.forEach(function (cfg, i) {
    var section = document.createElement('section');
    section.className = 'scene';
    section.id = cfg.id;
    section.style.setProperty('--len', cfg.length || 2.5);
    section.style.setProperty('--accent', cfg.accent || '#222');

    var sticky = document.createElement('div');
    sticky.className = 'scene__sticky';

    var media = {};

    if (cfg.type === 'blur') {
      // two stacked video layers: "from" (held on last frame) under "to"
      var fromV = makeVideo(cfg.fromVideo);
      var toV = makeVideo(cfg.toVideo);
      fromV.className = 'scene__layer scene__layer--from';
      toV.className = 'scene__layer scene__layer--to';
      sticky.appendChild(fromV);
      sticky.appendChild(toV);
      media.from = fromV;
      media.to = toV;

      // park each layer on the correct frame once metadata is known
      fromV.addEventListener('loadedmetadata', function () {
        seekTo(fromV, Math.max(0, fromV.duration - 0.05));
      });
      toV.addEventListener('loadedmetadata', function () { seekTo(toV, 0); });
    } else {
      var v = makeVideo(cfg.src);
      v.className = 'scene__video';
      sticky.appendChild(v);
      media.video = v;
    }

    var scrim = document.createElement('div');
    scrim.className = 'scene__scrim';
    sticky.appendChild(scrim);

    var content = document.createElement('div');
    content.className = 'scene__content';
    content.innerHTML =
      '<span class="scene__eyebrow"></span>' +
      '<h2 class="scene__title"></h2>' +
      '<p class="scene__copy"></p>';
    content.querySelector('.scene__eyebrow').textContent =
      pad(i + 1) + ' · ' + cfg.label;
    content.querySelector('.scene__title').textContent = cfg.heading;
    content.querySelector('.scene__copy').textContent = cfg.copy;
    sticky.appendChild(content);

    section.appendChild(sticky);
    tour.appendChild(section);

    // nav dot
    var dot = document.createElement('button');
    dot.className = 'dot';
    dot.style.setProperty('--c', cfg.accent || '#fff');
    dot.innerHTML = '<span class="dot__label">' + cfg.label + '</span>';
    dot.addEventListener('click', function () {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    dotsNav.appendChild(dot);

    sceneObjs.push({
      cfg: cfg,
      type: cfg.type,
      section: section,
      content: content,
      media: media,
      dot: dot,
    });
  });

  // ---- scroll loop --------------------------------------------------------
  var vh = window.innerHeight;
  var ticking = false;

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function update() {
    ticking = false;
    var scrollY = window.scrollY || window.pageYOffset;
    var docProgress = scrollY / (document.body.scrollHeight - vh || 1);
    setBarWidth(clamp(docProgress, 0, 1) * 100);

    // reveal the dots once we leave the hero
    dotsNav.classList.toggle('is-visible', scrollY > vh * 0.6);

    var active = -1;
    var bestDist = Infinity;

    for (var i = 0; i < sceneObjs.length; i++) {
      var s = sceneObjs[i];
      var top = s.section.offsetTop;
      var pinRange = s.section.offsetHeight - vh; // scroll distance while pinned
      var p = clamp((scrollY - top) / (pinRange || 1), 0, 1);

      // is the sticky stage on screen right now?
      var onScreen = scrollY + vh > top && scrollY < top + s.section.offsetHeight;

      if (onScreen) {
        if (s.type === 'blur') driveBlur(s, p);
        else driveVideo(s, p);

        // text: in over 0.08..0.30, hold, out over 0.78..0.96
        var reveal = ramp(p, 0.08, 0.30) * (1 - ramp(p, 0.78, 0.97));
        s.content.style.setProperty('--reveal', reveal.toFixed(3));

        // pick the most-centred scene for the active nav dot
        var centre = Math.abs((top + s.section.offsetHeight / 2) - (scrollY + vh / 2));
        if (centre < bestDist) { bestDist = centre; active = i; }
      }
    }

    for (var j = 0; j < sceneObjs.length; j++) {
      sceneObjs[j].dot.classList.toggle('is-active', j === active);
    }
  }

  // scrub a single video to the scroll progress
  function driveVideo(s, p) {
    var v = s.media.video;
    if (!v || !v.duration || isNaN(v.duration)) return;
    var t = p * (v.duration - 0.02);
    if (Math.abs(v.currentTime - t) > 0.02) seekTo(v, t);
  }

  // blur dissolve: from-layer (sharp->blurred, fades out), to-layer (blurred->sharp, fades in)
  function driveBlur(s, p) {
    var MAX = 26; // px of blur at the mid-point
    var from = s.media.from, to = s.media.to;

    var fromOpacity = 1 - ramp(p, 0.38, 0.9);
    var fromBlur = ramp(p, 0.0, 0.6) * MAX;
    var toOpacity = ramp(p, 0.12, 0.66);
    var toBlur = (1 - ramp(p, 0.4, 1.0)) * MAX;

    // gentle scale gives the dissolve some depth
    var fromScale = 1 + p * 0.04;
    var toScale = 1.06 - p * 0.06;

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
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto';
    v.loop = false;
    var source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    v.appendChild(source);
    // kick a load so duration/frames are ready for scrubbing
    v.load();
    return v;
  }

  // setting currentTime can be ignored while a seek is in flight; queue the latest
  function seekTo(v, t) {
    t = clamp(t, 0, (v.duration || 0));
    if (v.seeking) { v._pending = t; return; }
    v.currentTime = t;
    if (!v._wired) {
      v._wired = true;
      v.addEventListener('seeked', function () {
        if (v._pending != null) {
          var n = v._pending; v._pending = null;
          if (Math.abs(v.currentTime - n) > 0.02) v.currentTime = n;
        }
      });
    }
  }

  function setText(sel, txt) {
    var el = document.querySelector(sel);
    if (el) el.textContent = txt;
  }
  function setBarWidth(pct) {
    var bar = document.querySelector('.progress__bar');
    if (bar) bar.style.width = pct + '%';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // ---- init ---------------------------------------------------------------
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    onScrollOrResize();
  });
  window.addEventListener('load', update);
  update();
})();
