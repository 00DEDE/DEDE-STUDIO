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

  // ---- Pill state on scroll ---------------------------------------------
  var header = document.querySelector('.site-header');
  if (!header) return;
  var THRESHOLD = 20;
  var isScrolled = false;
  var ticking = false;

  function update() {
    var shouldBeScrolled = window.scrollY > THRESHOLD;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      header.classList.toggle('is-scrolled', isScrolled);
    }
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  // ---- Header-safe-top CSS variable -------------------------------------
  // Publish the header's current bottom-edge Y (in px, viewport-relative)
  // as --header-safe-top on the document root. Page CSS uses this for
  // body padding + sticky offsets so nothing ever ends up under the pill,
  // even as the header collapses / expands.
  var setHeaderTop = function () {
    var rect = header.getBoundingClientRect();
    document.documentElement.style.setProperty(
      '--header-safe-top', rect.bottom + 'px'
    );
  };
  setHeaderTop();
  if (window.ResizeObserver) {
    new ResizeObserver(setHeaderTop).observe(header);
  }
  window.addEventListener('resize', setHeaderTop, { passive: true });
  // CSS transitions on the header (padding / border-radius shrinking) can
  // fire multiple sub-events; capture the final settled value too.
  header.addEventListener('transitionend', setHeaderTop);
  // Scroll toggles .is-scrolled → header animates → re-measure a few times
  // during the transition so consumers stay in sync.
  window.addEventListener('scroll', function () {
    setTimeout(setHeaderTop, 100);
    setTimeout(setHeaderTop, 350);
    setTimeout(setHeaderTop, 600);
  }, { passive: true });

  // ---- Scroll-to-top button ---------------------------------------------
  // Shown on mobile (via CSS) once the page has scrolled past a threshold.
  // Clicking it smooth-scrolls back to y=0, which re-expands the collapsed
  // mobile header so the nav list is visible again.
  var scrollTop = document.querySelector('.scroll-top');
  if (scrollTop) {
    scrollTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    var stTicking = false;
    window.addEventListener('scroll', function () {
      if (stTicking) return;
      stTicking = true;
      requestAnimationFrame(function () {
        scrollTop.classList.toggle('is-visible', window.scrollY > 400);
        stTicking = false;
      });
    }, { passive: true });
  }
})();
