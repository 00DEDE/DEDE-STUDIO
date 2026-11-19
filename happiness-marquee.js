/* ═══════════════════════════════════════════════════════════════════
   HAPPINESS SCANS MARQUEE — shared across the 4 happiness sub-pages.

   One requestAnimationFrame loop per `.scans__row`. Pause rules:
     • The pointer must be over a media item (<img>/<video>), NOT over
       the gap between items. Hovering the gap keeps the row drifting.
     • A horizontal wheel/trackpad scrub drives the offset manually,
       then auto playback resumes 1.5s after the viewer stops.

   Videos autoplay continuously; nothing ever pauses them. The hover
   gesture only stops the row's horizontal drift, never the video
   playback itself.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var rows = document.querySelectorAll('.scans__row');
  if (!rows.length) return;

  var state = Array.prototype.map.call(rows, function (row) {
    return {
      row: row,
      track: row.querySelector('.scans__track'),
      speed: parseFloat(row.getAttribute('data-speed') || '0.5'),
      offset: 0,
      halfWidth: 0,
      paused: false,
      wheelTO: null,
      hoverCount: 0
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
      if (!s.paused) s.offset -= s.speed;
      while (s.offset <= -s.halfWidth) s.offset += s.halfWidth;
      while (s.offset > 0)             s.offset -= s.halfWidth;
      s.track.style.transform = 'translateX(' + s.offset + 'px)';
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  state.forEach(function (s) {
    if (!s.track) return;

    /* Per-media hover: hovering an img/video pauses the row; gaps
       between items don't fire, so the row keeps drifting if the
       cursor sits in the gap. */
    s.track.querySelectorAll('img, video').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        s.hoverCount++;
        s.paused = true;
      });
      el.addEventListener('mouseleave', function () {
        s.hoverCount = Math.max(0, s.hoverCount - 1);
        if (s.hoverCount === 0 && !s.wheelTO) s.paused = false;
      });
    });

    /* Horizontal wheel/trackpad scrub — row-level since scrubbing
       through gaps is still a valid gesture. */
    s.row.addEventListener('wheel', function (e) {
      var dy = e.deltaY || 0, dx = e.deltaX || 0;
      if (Math.abs(dx) <= Math.abs(dy)) return;
      e.preventDefault();
      s.paused = true;
      s.offset -= dx;
      if (s.wheelTO) clearTimeout(s.wheelTO);
      s.wheelTO = setTimeout(function () {
        s.wheelTO = null;
        if (s.hoverCount === 0) s.paused = false;
      }, 1500);
    }, { passive: false });
  });
})();
