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

  // ---- Hamburger pill (draggable, position persisted) ------------------
  // Injected into <body>. Default spot: below the header brand mark
  // (CSS). The user can drag it anywhere in the band BELOW the header
  // and ABOVE the footer; the position is saved to localStorage and
  // restored on every page / reload. Click (no drag) toggles the nav.
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
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  // Tapping a nav link closes the overlay before navigating.
  header.querySelectorAll('.site-header__nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  // Click anywhere outside the pill + dropdown closes the menu.
  document.addEventListener('pointerdown', function (e) {
    if (!document.body.classList.contains('is-nav-open')) return;
    if (menuBtn.contains(e.target)) return;
    var nav = document.querySelector('.site-header__nav');
    if (nav && nav.contains(e.target)) return;
    setMenu(false);
  });

  // --- Drag + persistence ---------------------------------------------
  var PILL_KEY    = 'dedeMenuBtnPos';
  var PILL_MARGIN = 8;
  var DRAG_THRESHOLD = 4;  // px before pointermove counts as a drag

  function footerEl() { return document.querySelector('.site-footer'); }

  // Allowed drop zone: strictly BELOW the header and ABOVE the footer.
  // When the footer is scrolled off below the viewport, the viewport
  // bottom acts as the lower bound instead.
  function dropBounds() {
    var hb = header.getBoundingClientRect().bottom + PILL_MARGIN;
    var f  = footerEl();
    var fTop = f ? f.getBoundingClientRect().top : window.innerHeight;
    var yMax = Math.min(window.innerHeight, fTop) - PILL_MARGIN;
    var w = menuBtn.offsetWidth  || 76;
    var h = menuBtn.offsetHeight || 40;
    return {
      minX: PILL_MARGIN,
      maxX: window.innerWidth - w - PILL_MARGIN,
      minY: hb,
      maxY: yMax - h
    };
  }
  function clampTo(bounds, pt) {
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, pt.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, pt.y))
    };
  }
  function applyPos(x, y) {
    menuBtn.style.left = x + 'px';
    menuBtn.style.top  = y + 'px';
    menuBtn.classList.add('is-placed');
  }
  function savePos(x, y) {
    try { localStorage.setItem(PILL_KEY, JSON.stringify({ x: x, y: y })); } catch (_) {}
  }
  function loadPos() {
    try {
      var raw = localStorage.getItem(PILL_KEY);
      var o = raw ? JSON.parse(raw) : null;
      if (o && typeof o.x === 'number' && typeof o.y === 'number') return o;
    } catch (_) {}
    return null;
  }

  // Restore saved position after layout settles (so header/footer rects
  // are accurate when we clamp).
  requestAnimationFrame(function () {
    var saved = loadPos();
    if (!saved) return;
    var p = clampTo(dropBounds(), saved);
    applyPos(p.x, p.y);
  });

  var dragging = false, moved = false;
  var startCX, startCY, startX, startY;

  menuBtn.addEventListener('pointerdown', function (e) {
    // Don't drag while the menu is open — the open pill is a close-button.
    if (document.body.classList.contains('is-nav-open')) return;
    dragging = true; moved = false;
    startCX = e.clientX; startCY = e.clientY;
    var r = menuBtn.getBoundingClientRect();
    startX = r.left; startY = r.top;
    try { menuBtn.setPointerCapture(e.pointerId); } catch (_) {}
    menuBtn.classList.add('is-dragging');
  });
  menuBtn.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startCX;
    var dy = e.clientY - startCY;
    if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) moved = true;
    if (!moved) return;
    var p = clampTo(dropBounds(), { x: startX + dx, y: startY + dy });
    applyPos(p.x, p.y);
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { menuBtn.releasePointerCapture(e.pointerId); } catch (_) {}
    menuBtn.classList.remove('is-dragging');
    if (moved) {
      var r = menuBtn.getBoundingClientRect();
      savePos(r.left, r.top);
    }
  }
  menuBtn.addEventListener('pointerup', endDrag);
  menuBtn.addEventListener('pointercancel', endDrag);

  // Click → toggle menu, but only when the pointer didn't travel enough
  // to count as a drag. Clear the moved flag after swallowing the click.
  menuBtn.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; return; }
    setMenu(!document.body.classList.contains('is-nav-open'));
  });

  // Keep the pill in bounds when the viewport or header/footer sizes change.
  function reclamp() {
    if (!menuBtn.classList.contains('is-placed')) return;
    var r = menuBtn.getBoundingClientRect();
    var p = clampTo(dropBounds(), { x: r.left, y: r.top });
    applyPos(p.x, p.y);
    savePos(p.x, p.y);
  }
  window.addEventListener('resize', reclamp, { passive: true });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(reclamp);
    ro.observe(header);
    var f = footerEl();
    if (f) ro.observe(f);
  }

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
