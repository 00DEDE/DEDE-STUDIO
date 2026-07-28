/* Randomize each site-bg blob's animation delay + duration on every
   page load, so the four blobs drift in a different phase pattern on
   every visit and every page. Home page intentionally does NOT include
   this script — its splash keeps a fixed, choreographed motion.
   Skipped on prefers-reduced-motion (animations already disabled). */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.site-bg__blob').forEach((blob) => {
    // Delay is negative so blobs start mid-cycle — no synchronized wave
    // at load. Range picks any point within a full 60s cycle window.
    const delay = -Math.random() * 60;
    // Duration jitters ±20% around each blob's base value so they
    // never drift back into phase over time.
    const cs = getComputedStyle(blob);
    const baseDur = parseFloat(cs.animationDuration) || 40; // seconds
    const jitter = 0.8 + Math.random() * 0.4;
    blob.style.animationDelay = delay + 's';
    blob.style.animationDuration = (baseDur * jitter) + 's';
  });
})();
