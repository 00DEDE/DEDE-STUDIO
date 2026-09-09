/* Case-study click transition — for any anchor tagged with
   `data-case-transition` (currently the UNESCO cells on home + mind).
   On click:
     1. Read the cell's bounding rect
     2. Pull the background image from the active carousel slide OR
        the cell's --cover CSS var (single-cover cells)
     3. Drop a fixed-position overlay + a dimmer into the page
     4. Animate the overlay: transform-only (translate+scale) so it
        grows from the cell to full viewport, GPU-composited
     5. Navigate to href when the animation is ~90% done — the
        destination page's own on-load `unesco-land` animation picks
        up seamlessly

   Cross-browser: uses plain CSS transitions + requestAnimationFrame;
   works everywhere modern (no View Transitions API dependency).
   Falls back to a plain navigation if reduced motion is on or if
   no source image can be found. */
(function () {
  'use strict';

  const DURATION_MS = 460;
  const NAV_AT_MS   = 400;      // navigate slightly before the animation ends

  function sourceImageOf(cell) {
    // Carousel-style cell: read the active slide's computed background-image
    const active = cell.querySelector('.cover-slide.is-active');
    if (active) {
      const bg = window.getComputedStyle(active).backgroundImage;
      if (bg && bg !== 'none') return bg;
    }
    // Single-cover cell: use the --cover custom property from inline style
    const cover = cell.style.getPropertyValue('--cover').trim();
    if (cover) return cover;
    // Cover cell inside a work section (home): check the work__cover child
    const cover2 = cell.querySelector('.work__cover');
    if (cover2) {
      const bg = window.getComputedStyle(cover2).backgroundImage;
      if (bg && bg !== 'none') return bg;
    }
    return null;
  }

  function run(cell, e) {
    // Respect reduced-motion preference — skip the animation entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bg = sourceImageOf(cell);
    if (!bg) return;   // no image to expand — let default nav happen

    e.preventDefault();

    const rect = cell.getBoundingClientRect();

    // Overlay: positioned + sized at the cell's exact rect
    const overlay = document.createElement('div');
    overlay.className = 'case-transition';
    overlay.style.left            = rect.left  + 'px';
    overlay.style.top             = rect.top   + 'px';
    overlay.style.width           = rect.width  + 'px';
    overlay.style.height          = rect.height + 'px';
    overlay.style.backgroundImage = bg;
    overlay.style.setProperty('--case-dur', DURATION_MS + 'ms');
    document.body.appendChild(overlay);

    // Dimmer fades the rest of the page during the expand
    const dimmer = document.createElement('div');
    dimmer.className = 'case-transition--dimmer';
    document.body.appendChild(dimmer);

    // Trigger next frame so the browser paints the starting state first
    requestAnimationFrame(function () {
      // Expand: scale to cover viewport, translate so top-left lands at 0,0
      const scaleX = window.innerWidth  / rect.width;
      const scaleY = window.innerHeight / rect.height;
      const tx     = -rect.left;
      const ty     = -rect.top;
      overlay.style.transform    = 'translate(' + tx + 'px, ' + ty + 'px) '
                                 + 'scale(' + scaleX + ', ' + scaleY + ')';
      overlay.style.borderRadius = '0';
      dimmer.classList.add('is-active');
    });

    // Hand off to the destination page before the transition completes
    // so the landing animation on unesco.html picks up seamlessly.
    const href = cell.getAttribute('href');
    setTimeout(function () { window.location.href = href; }, NAV_AT_MS);
  }

  document.querySelectorAll('a[data-case-transition]').forEach(function (cell) {
    cell.addEventListener('click', function (e) { run(cell, e); });
  });
})();
