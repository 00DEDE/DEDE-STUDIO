/* Shared behavior for every .marquee-band on the page:
     1. Cursor-tracking spotlight on the sharp overlay (hover devices only).
     2. Per-marquee animation-duration set so every band scrolls at the
        same pixels-per-second regardless of phrase length. The reference
        pace was chosen to match the original selections marquee (48s
        for a ~9600px phrase → 200 px/s).
*/
(function () {
  const REFERENCE_SPEED = 64;  // pixels per second (50% slower than 128)

  function tuneSpeed() {
    document.querySelectorAll('.marquee-band').forEach((band) => {
      const phrase = band.querySelector('.marquee-phrase');
      if (!phrase) return;
      const w = phrase.getBoundingClientRect().width;
      if (!w) return;
      band.style.setProperty('--marquee-duration', (w / REFERENCE_SPEED) + 's');
    });
  }

  // Wait for fonts + images so phrase width is measured after layout is
  // settled — text width and inline icon size both feed into the total.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(tuneSpeed);
  } else {
    window.addEventListener('load', tuneSpeed);
  }
  // Recompute on resize so a viewport change keeps the pace consistent.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(tuneSpeed, 150);
  }, { passive: true });

  /* Pause every marquee animation (scroll track + mobile spotlight
     mask) when its band is off-screen. Painting a full-viewport-wide
     blurred marquee at 60fps while it's off-screen was wasted work;
     this cuts the wasted frames outright. Same IO for every band. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = entry.isIntersecting ? 'running' : 'paused';
        entry.target
          .querySelectorAll('.marquee-track, .marquee-band__sharp')
          .forEach((el) => { el.style.animationPlayState = state; });
      });
    }, { threshold: 0.01 });
    document.querySelectorAll('.marquee-band').forEach((band) => io.observe(band));
  }

  /* Cursor spotlight — skipped on touch. */
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.marquee-band').forEach((band) => {
    const sharp = band.querySelector('.marquee-band__sharp');
    if (!sharp) return;
    band.addEventListener('mousemove', (e) => {
      const rect = band.getBoundingClientRect();
      sharp.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      sharp.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
    band.addEventListener('mouseleave', () => {
      sharp.style.setProperty('--mx', '-1000px');
      sharp.style.setProperty('--my', '-1000px');
    });
  });
})();
