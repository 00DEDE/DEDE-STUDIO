/* ═══════════════════════════════════════════════════════════════════
   IDENTITY BANNER — shared by /home/, /work/, /play/ and every page a
   work/play cell links to. Drives two surfaces simultaneously:
     • Mobile strip  → `.home-tag` / `.home-tag__text`
     • Desktop text  → `.header-tag` / `.header-tag__text`

   Visibility modes:
     • <body data-banner-always> → both surfaces are shown immediately
       and never hide.
     • Otherwise (home page) → latched reveal: both surfaces appear
       when `[data-banner-anchor]` is ≥50% in view, and retract when
       the page is scrolled back near the very top.

   Either surface may be absent on a given page (hidden by CSS) and
   the code tolerates that.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var tags = Array.prototype.filter.call(
    document.querySelectorAll('.home-tag, .header-tag'),
    function (el) { return !!el.querySelector('.home-tag__text, .header-tag__text'); }
  );
  if (!tags.length) return;

  function setActive(on) {
    tags.forEach(function (t) {
      t.setAttribute('data-active', on ? 'true' : 'false');
    });
  }

  function textOf(tag) {
    return tag.querySelector('.home-tag__text, .header-tag__text');
  }

  var messages = [
    'David Gomez. Graphic Designer.',
    'Dede is pronounced day-day.',
    'David Gomez. Diseñador Gráfico.'
  ];

  // Initial text so no flash of stale markup on first paint.
  tags.forEach(function (t) { textOf(t).textContent = messages[0]; });

  var idx = 0;
  setInterval(function () {
    idx = (idx + 1) % messages.length;
    tags.forEach(function (t) { t.classList.add('is-swapping'); });
    setTimeout(function () {
      tags.forEach(function (t) {
        textOf(t).textContent = messages[idx];
        t.classList.remove('is-swapping');
      });
    }, 240);
  }, 12000);

  /* Always-on mode: body carries `data-banner-always`. Reveal now,
     skip all observer/scroll logic. */
  if (document.body.hasAttribute('data-banner-always')) {
    setActive(true);
    return;
  }

  /* Latched mode: appear once [data-banner-anchor] is ≥50% visible,
     retract when scrolled back near the top. */
  var anchor = document.querySelector('[data-banner-anchor]');
  if (!anchor) return;

  var latched = false;
  var TOP_HIDE = 80;

  window.addEventListener('scroll', function () {
    if (latched && window.scrollY <= TOP_HIDE) {
      latched = false;
      setActive(false);
    }
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!latched && e.isIntersecting && e.intersectionRatio >= 0.5) {
          latched = true;
          setActive(true);
        }
      });
    }, { threshold: [0, 0.5, 1] });
    io.observe(anchor);
  }
})();
