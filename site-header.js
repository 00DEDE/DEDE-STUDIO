(function () {
  // ---- Custom cursor ----------------------------------------------------
  // The native OS cursor is hidden (theme.css) and replaced with a fixed
  // DOM element rendering the brand plus mark. mix-blend-mode: difference
  // keeps the mark readable over any surface — black on white, white on
  // black. Pointer-fine only: touch devices skip the whole setup.
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    var cursor = document.createElement('div');
    cursor.id = 'site-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    var cx = -100, cy = -100, pending = false;
    function paint() {
      pending = false;
      cursor.style.transform = 'translate3d(' + cx + 'px, ' + cy + 'px, 0)';
    }
    window.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      if (!pending) { pending = true; requestAnimationFrame(paint); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      cursor.classList.add('is-hidden');
    });
    document.addEventListener('pointerenter', function () {
      cursor.classList.remove('is-hidden');
    });
    window.addEventListener('blur',  function () { cursor.classList.add('is-hidden'); });
    window.addEventListener('focus', function () { cursor.classList.remove('is-hidden'); });
  }

  // ---- Bottom blur band ------------------------------------------------
  // Mirrors the frosted strip under the header at the viewport bottom
  // (styles in site-header.css). Injected sitewide so every page gets
  // the same softened edge; desktop + mobile.
  if (!document.querySelector('.site-fade-bottom')) {
    var fade = document.createElement('div');
    fade.className = 'site-fade-bottom';
    fade.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fade);
  }

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

  // ---- Mobile hamburger (bottom-centre floating button) ----------------
  // Injected into <body> so it floats at the viewport bottom, independent
  // of header geometry. 3-line icon; morphs to × on open. Toggles the
  // body class .is-nav-open which shows the nav as a full-screen overlay.
  var menuBtn = document.querySelector('.site-menu-btn');
  if (!menuBtn) {
    menuBtn = document.createElement('button');
    menuBtn.className = 'site-menu-btn';
    menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', 'Menu');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(menuBtn);
  }
  function setMenu(open) {
    document.body.classList.toggle('is-nav-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  menuBtn.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('is-nav-open'));
  });

  // ---- Desktop side-drawer hamburger (top-left floating pill) ----------
  // Injected into <body>. CSS hides it under 641px; the mobile hamburger
  // handles small viewports. Toggles body.is-sidenav-open, which slides
  // in the left drawer and pushes header + content right by --sidenav-w.
  var sideBtn = document.querySelector('.site-sidenav-btn');
  if (!sideBtn) {
    sideBtn = document.createElement('button');
    sideBtn.className = 'site-sidenav-btn';
    sideBtn.type = 'button';
    sideBtn.setAttribute('aria-label', 'Menu');
    sideBtn.setAttribute('aria-expanded', 'false');
    sideBtn.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(sideBtn);
  }
  function setSideNav(open) {
    document.body.classList.toggle('is-sidenav-open', open);
    sideBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  sideBtn.addEventListener('click', function () {
    setSideNav(!document.body.classList.contains('is-sidenav-open'));
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setMenu(false); setSideNav(false); }
  });
  // Tapping a nav link closes whichever variant was open before navigating.
  header.querySelectorAll('.site-header__nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); setSideNav(false); });
  });

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

    // Publish 0–1 scroll progress on the root as --scroll-progress.
    // CSS color-mix uses it to fade the header's bottom rule from the
    // default --line hairline → brand cyan (--accent) by page-end.
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    document.documentElement.style.setProperty('--scroll-progress', ratio);

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
