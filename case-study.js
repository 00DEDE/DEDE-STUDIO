/* ═══════════════════════════════════════════════════════════════════
   CASE-STUDY SHARED INTERACTIONS
   ─────────────────────────────────────────────────────────────────
   Companion to case-study.css. Pulls the behaviors every case-study
   page needs: read-more expand/collapse, media-tab expand/collapse,
   and the scroll-cue fade-out. Load with:

     <script src="/case-study.js" defer></script>

   Page-specific interactions (orchestrated slideshows, carousels,
   atlas scrubbers, etc.) still live in that page's own inline
   <script>.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Media tabs — single Waabi-style corner pill. Click toggles
     aria-expanded; CSS does the width animation. */
  document.querySelectorAll('.media-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var open = tab.getAttribute('aria-expanded') === 'true';
      tab.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  /* ─── Scroll cue — fade the bouncing arrow once the viewer has
     scrolled past the first ~40% of the viewport. */
  var scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    var hideScrollCue = function () {
      if (window.scrollY > window.innerHeight * 0.4) {
        scrollCue.classList.add('is-hidden');
        window.removeEventListener('scroll', hideScrollCue);
      }
    };
    window.addEventListener('scroll', hideScrollCue, { passive: true });
  }

  /* ─── Read-more panels — each <button class="read-more"> opens or
     closes a <div class="read-more__panel"> linked by aria-controls.
     The button's text alternates between "Read more" and "Read less",
     and aria-expanded is the source of truth so SR users see the
     correct state. */
  document.querySelectorAll('.read-more').forEach(function (btn) {
    var targetId = btn.getAttribute('aria-controls');
    var panel = targetId ? document.getElementById(targetId) : null;
    if (!panel) return;
    var labelSpan = btn.querySelector('span:not(.read-more__line)');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.classList.toggle('is-open', !open);
      if (labelSpan) labelSpan.textContent = open ? 'Read more' : 'Read less';
    });
  });
})();
