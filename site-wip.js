/* WORK IN PROGRESS watermark — injected on every page.
   Track holds N identical horizontal rows of "WORK IN PROGRESS"
   stacked vertically. The track falls downward by exactly one row-
   height per animation cycle; because every row is identical, the
   loop is seamless (see site-wip.css @keyframes site-wip-fall).
   Appended last on body so its z-index sits at the top of the root
   stacking context above every other fixed/positioned element. */
(function () {
  'use strict';
  if (document.querySelector('.site-wip')) return;   // idempotent

  var ROW_COUNT = 20;   // enough rows to fill the viewport on every device

  var wip = document.createElement('div');
  wip.className = 'site-wip';
  wip.setAttribute('aria-hidden', 'true');

  var track = document.createElement('div');
  track.className = 'site-wip__track';
  for (var i = 0; i < ROW_COUNT; i++) {
    var row = document.createElement('span');
    row.className = 'site-wip__row';
    row.textContent = 'WORK IN PROGRESS';
    track.appendChild(row);
  }
  wip.appendChild(track);

  if (document.body) {
    document.body.appendChild(wip);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(wip);
    });
  }
})();
