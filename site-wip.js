/* WORK IN PROGRESS watermark — injected on every page.
   One phrase repeated twice in the track = seamless loop
   (see site-wip.css @keyframes site-wip-fall). Appended last on
   body so its z-index sits at the top of the root stacking context
   above every other fixed / positioned element on the site. */
(function () {
  'use strict';
  if (document.querySelector('.site-wip')) return;   // idempotent
  var wip = document.createElement('div');
  wip.className = 'site-wip';
  wip.setAttribute('aria-hidden', 'true');
  wip.innerHTML =
    '<span class="site-wip__track">WORK IN PROGRESS WORK IN PROGRESS </span>';
  if (document.body) {
    document.body.appendChild(wip);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(wip);
    });
  }
})();
