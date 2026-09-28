/* WORK IN PROGRESS watermark — injected on every page.
   One instance of the text that falls once through the viewport
   on page load (top → bottom), then holds offscreen. See
   site-wip.css @keyframes site-wip-fall for the animation. */
(function () {
  'use strict';
  if (document.querySelector('.site-wip')) return;   // idempotent

  var wip = document.createElement('div');
  wip.className = 'site-wip';
  wip.setAttribute('aria-hidden', 'true');

  var row = document.createElement('span');
  row.className = 'site-wip__row';
  row.textContent = 'WORK IN PROGRESS';
  wip.appendChild(row);

  if (document.body) {
    document.body.appendChild(wip);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(wip);
    });
  }
})();
