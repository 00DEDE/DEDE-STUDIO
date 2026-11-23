/* ═══════════════════════════════════════════════════════════════════
   HAPPINESS SCANS MARQUEE — shared across the 4 happiness sub-pages
   and the cafe-bustelo page.

   One requestAnimationFrame loop per `.scans__row`. Interactions:

     • DESKTOP — hover near the LEFT or RIGHT edge of the row to
       accelerate the drift. Center ~70% of the row behaves normally
       (hovering a media item still pauses the row; hovering the gap
       between items keeps it drifting). The edge zones apply a
       smooth speed multiplier that peaks at 3.5× base speed right at
       the row's edge. Left edge reverses the direction; right edge
       accelerates the natural leftward drift.

     • MOBILE — touch anywhere in the row and swipe left/right to
       scrub through the images manually. Release and auto drift
       resumes 1.5s later. Vertical page scroll always passes through
       untouched (touch-action: pan-y).

     • A horizontal wheel/trackpad scrub drives the offset manually on
       trackpads too, with the same 1.5s auto-resume cooldown.

   Videos autoplay continuously; nothing ever pauses them. The hover
   gesture only stops the row's horizontal drift, never the video
   playback itself.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var rows = document.querySelectorAll('.scans__row');
  if (!rows.length) return;

  /* Edge-hover tuning (desktop). */
  var EDGE_ZONE_FRAC = 0.18;   // outer 18% of each side is the boost zone
  var MAX_BOOST      = 3.5;    // max multiplier at the row's very edge

  /* Scrub cooldown (wheel + touch). */
  var RESUME_MS = 1500;

  var state = Array.prototype.map.call(rows, function (row) {
    return {
      row: row,
      track: row.querySelector('.scans__track'),
      baseSpeed: parseFloat(row.getAttribute('data-speed') || '0.5'),
      offset: 0,
      halfWidth: 0,
      paused: false,
      scrubTO: null,       // active cooldown from wheel/touch
      hoverCount: 0,       // how many child media elements the cursor is over
      edgeBoost: 0,        // -1 (left edge) → 0 (middle) → +1 (right edge)
      touchActive: false,  // finger currently down on this row
      touchStartX: 0,
      touchLastX: 0,
      touchDecidedAxis: '' // '', 'x', 'y' — once decided per gesture
    };
  });

  function measure() {
    state.forEach(function (s) {
      s.halfWidth = s.track ? s.track.scrollWidth / 2 : 0;
    });
  }
  window.addEventListener('load',   measure);
  window.addEventListener('resize', measure);
  state.forEach(function (s) {
    if (!s.track) return;
    s.track.querySelectorAll('img').forEach(function (img) {
      if (!img.complete) img.addEventListener('load', measure, { once: true });
    });
  });
  measure();

  function tick() {
    state.forEach(function (s) {
      if (!s.halfWidth) return;
      if (s.touchActive) {
        /* Finger owns the offset while touching — no auto advance. */
      } else if (!s.paused || s.edgeBoost) {
        /* Base drift (leftward). Edge boost adds a multiplier: positive
           (right edge) accelerates leftward, negative (left edge)
           reverses direction. Edge boost ALWAYS wins over a hover-pause
           so lingering the cursor on an edge image doesn't trap the
           row at a halt. */
        var speed = s.baseSpeed * (1 + Math.abs(s.edgeBoost) * (MAX_BOOST - 1));
        if (s.edgeBoost < 0) speed = -speed;  // left edge → reverse
        s.offset -= speed;
      }
      while (s.offset <= -s.halfWidth) s.offset += s.halfWidth;
      while (s.offset > 0)             s.offset -= s.halfWidth;
      s.track.style.transform = 'translateX(' + s.offset + 'px)';
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  state.forEach(function (s) {
    if (!s.track) return;

    /* Per-media hover: pausing fires over an <img>/<video>; the gaps
       between items don't fire, so the row keeps drifting if the
       cursor sits in the gap. (Edge zones below override this so an
       edge image doesn't trap the row at a halt.) */
    s.track.querySelectorAll('img, video').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        s.hoverCount++;
        if (!s.edgeBoost) s.paused = true;
      });
      el.addEventListener('mouseleave', function () {
        s.hoverCount = Math.max(0, s.hoverCount - 1);
        if (s.hoverCount === 0 && !s.scrubTO) s.paused = false;
      });
    });

    /* Desktop edge-hover speed control. Pointer x within the row is
       mapped to a -1..+1 boost value; the outer 18% on each side gets
       a non-zero boost that peaks at the edge. Mouse/trackpad only —
       touch skips this so it can't interfere with the pan gesture. */
    s.row.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var rect = s.row.getBoundingClientRect();
      var rel  = (e.clientX - rect.left) / rect.width;
      if (rel < EDGE_ZONE_FRAC) {
        s.edgeBoost = -(1 - rel / EDGE_ZONE_FRAC);        // -1 at edge → 0 at frac
      } else if (rel > 1 - EDGE_ZONE_FRAC) {
        s.edgeBoost = (rel - (1 - EDGE_ZONE_FRAC)) / EDGE_ZONE_FRAC; // 0 → +1
      } else {
        s.edgeBoost = 0;
      }
      /* While in an edge zone the row MUST keep moving; override the
         hover-pause so a lingering cursor on an edge image doesn't
         freeze the acceleration. */
      if (s.edgeBoost) s.paused = false;
    });
    s.row.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      s.edgeBoost = 0;
    });

    /* Horizontal wheel/trackpad scrub. */
    s.row.addEventListener('wheel', function (e) {
      var dy = e.deltaY || 0, dx = e.deltaX || 0;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      e.preventDefault();
      s.paused = true;
      s.offset -= dx;
      if (s.scrubTO) clearTimeout(s.scrubTO);
      s.scrubTO = setTimeout(function () {
        s.scrubTO = null;
        if (s.hoverCount === 0) s.paused = false;
      }, RESUME_MS);
    }, { passive: false });

    /* Touch pan — swipe horizontally to scrub manually. Vertical
       dominant moves are left alone so page scroll still works. */
    s.row.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      s.touchActive = true;
      s.touchDecidedAxis = '';
      s.touchStartX = e.touches[0].clientX;
      s.touchLastX  = s.touchStartX;
      s.touchStartY = e.touches[0].clientY;
      /* Hold current position — don't auto-advance until finger lifts
         and the cooldown finishes. */
      s.paused = true;
      if (s.scrubTO) { clearTimeout(s.scrubTO); s.scrubTO = null; }
    }, { passive: true });

    s.row.addEventListener('touchmove', function (e) {
      if (!s.touchActive || e.touches.length !== 1) return;
      var cx = e.touches[0].clientX;
      var cy = e.touches[0].clientY;
      var dx = cx - s.touchLastX;
      s.touchLastX = cx;
      /* Decide axis on the first meaningful move; once decided, stick
         with it for the rest of the gesture. */
      if (!s.touchDecidedAxis) {
        var tdx = Math.abs(cx - s.touchStartX);
        var tdy = Math.abs(cy - s.touchStartY);
        if (tdx + tdy < 6) return;                 // ignore jitter
        s.touchDecidedAxis = tdx > tdy ? 'x' : 'y';
      }
      if (s.touchDecidedAxis !== 'x') return;      // vertical → let page scroll
      e.preventDefault();                          // claim this gesture
      s.offset += dx;
    }, { passive: false });

    function endTouch() {
      if (!s.touchActive) return;
      s.touchActive = false;
      /* Cool-down before auto-drift resumes so the row doesn't jerk
         away the instant the finger lifts. */
      if (s.scrubTO) clearTimeout(s.scrubTO);
      s.scrubTO = setTimeout(function () {
        s.scrubTO = null;
        if (s.hoverCount === 0) s.paused = false;
      }, RESUME_MS);
    }
    s.row.addEventListener('touchend',    endTouch);
    s.row.addEventListener('touchcancel', endTouch);
  });
})();
