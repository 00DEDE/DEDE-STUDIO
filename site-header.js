(function () {
  // Highlight the current page in the nav.
  var path = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
  document.querySelectorAll('.site-header__nav a').forEach(function (a) {
    if (a.getAttribute('href').toLowerCase() === path) {
      a.classList.add('is-current');
    }
  });

  // ---- Theme toggle ------------------------------------------------------
  // The theme is applied inline in <head> before render (see the small
  // early-theme script on each page) so we never see a flash. This handler
  // just flips it on click and remembers the choice.
  var toggle = document.querySelector('.site-header__theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  var header = document.querySelector('.site-header');
  if (!header) return;

  // ---- Header-safe-top CSS variable -------------------------------------
  // Publish the header's bottom-edge Y (px, viewport-relative) as
  // --header-safe-top on the root. Page CSS uses it for body padding
  // + sticky offsets so nothing ever ends up under the pill.
  function setHeaderTop() {
    var rect = header.getBoundingClientRect();
    document.documentElement.style.setProperty('--header-safe-top', rect.bottom + 'px');
  }
  setHeaderTop();
  if (window.ResizeObserver) new ResizeObserver(setHeaderTop).observe(header);
  window.addEventListener('resize', setHeaderTop, { passive: true });
  // Transitions on the header (padding / border-radius shrinking) fire
  // multiple sub-events; capture the settled value at the end.
  header.addEventListener('transitionend', setHeaderTop);

  // ---- Unified scroll handler -------------------------------------------
  // ONE scroll listener does everything: pill-state toggle, scroll-top
  // visibility, and — only when the pill state actually flips — schedules
  // a short burst of re-measures to keep --header-safe-top in sync
  // during the pill's own padding transition. Previously each of these
  // ran on its own listener, and the re-measure burst fired on EVERY
  // scroll frame instead of only on the flip.
  var THRESHOLD    = 20;
  var TOP_VISIBLE  = 400;
  var isScrolled   = false;
  var ticking      = false;
  var scrollTop    = document.querySelector('.scroll-top');

  function update() {
    var y = window.scrollY;

    var shouldBeScrolled = y > THRESHOLD;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      header.classList.toggle('is-scrolled', isScrolled);
      // Header is now animating its padding. Re-measure a few times
      // during the transition; transitionend catches the final.
      setTimeout(setHeaderTop, 100);
      setTimeout(setHeaderTop, 350);
      setTimeout(setHeaderTop, 600);
    }

    if (scrollTop) scrollTop.classList.toggle('is-visible', y > TOP_VISIBLE);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();

  // ---- Scroll-to-top button click ---------------------------------------
  // Clicking smooth-scrolls back to y=0, which re-expands the collapsed
  // mobile header so the nav list is visible again.
  if (scrollTop) {
    scrollTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
