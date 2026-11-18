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
    if (open) {
      positionDropdown();
    } else {
      // Clear the inline positioning so the next open starts fresh.
      var nav = document.querySelector('.site-header__nav');
      if (nav) { nav.style.left = ''; nav.style.top = ''; nav.style.transform = ''; nav.style.visibility = ''; }
    }
  }

  // Anchor the dropdown rectangle under the pill (desktop only). Called
  // when the menu opens and on resize while open, so the rectangle
  // tracks whatever position the pill was dragged to.
  function positionDropdown() {
    if (!window.matchMedia('(min-width: 641px)').matches) return;
    var nav = document.querySelector('.site-header__nav');
    if (!nav) return;
    var pillRect = menuBtn.getBoundingClientRect();
    // Measure the dropdown offscreen so we can clamp its left edge
    // into the viewport before showing it in place.
    nav.style.visibility = 'hidden';
    nav.style.left = '0px';
    nav.style.top  = '0px';
    nav.style.transform = 'none';
    var navW = nav.offsetWidth || 240;
    var x = pillRect.left;
    var margin = 8;
    if (x + navW > window.innerWidth - margin) x = window.innerWidth - navW - margin;
    if (x < margin) x = margin;
    nav.style.left = x + 'px';
    nav.style.top  = (pillRect.bottom + 8) + 'px';
    nav.style.visibility = '';
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

  // --- Drag + persistence (DESKTOP ONLY; horizontal only) --------------
  // Mobile pill is static at bottom-centre (CSS + !important). Desktop
  // pill is sticky to the header's bottom edge; only X moves, and only
  // between the viewport left/right. Position is saved in localStorage
  // so the pill stays where the user parked it across pages/reloads.
  // Bumped suffix (`-r2`) retires any pill position saved under the
  // old left-default key — every visitor now starts at the new
  // right-side default until they drag.
  var PILL_KEY       = 'dedeMenuBtnX-r2';
  var PILL_MARGIN    = 8;
  var DRAG_THRESHOLD = 4;
  var mqDesktop      = window.matchMedia('(min-width: 641px)');

  function clampX(x) {
    var w = menuBtn.offsetWidth || 76;
    return Math.max(PILL_MARGIN, Math.min(window.innerWidth - w - PILL_MARGIN, x));
  }
  function applyX(x) {
    menuBtn.style.left = x + 'px';
    menuBtn.classList.add('is-placed');
  }
  function saveX(x) {
    try { localStorage.setItem(PILL_KEY, String(x)); } catch (_) {}
  }
  function loadX() {
    try {
      var v = parseFloat(localStorage.getItem(PILL_KEY));
      return isFinite(v) ? v : null;
    } catch (_) { return null; }
  }

  // Restore saved X on desktop after layout settles.
  requestAnimationFrame(function () {
    if (!mqDesktop.matches) return;
    var x = loadX();
    if (x != null) applyX(clampX(x));
  });

  var dragging = false, moved = false;
  var startCX, startX;

  menuBtn.addEventListener('pointerdown', function (e) {
    if (!mqDesktop.matches) return;                          // mobile: no drag
    if (document.body.classList.contains('is-nav-open')) return;
    dragging = true; moved = false;
    startCX = e.clientX;
    startX = menuBtn.getBoundingClientRect().left;
    try { menuBtn.setPointerCapture(e.pointerId); } catch (_) {}
    menuBtn.classList.add('is-dragging');
  });
  menuBtn.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startCX;
    if (!moved && Math.abs(dx) > DRAG_THRESHOLD) moved = true;
    if (!moved) return;
    applyX(clampX(startX + dx));
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { menuBtn.releasePointerCapture(e.pointerId); } catch (_) {}
    menuBtn.classList.remove('is-dragging');
    if (moved) saveX(menuBtn.getBoundingClientRect().left);
  }
  menuBtn.addEventListener('pointerup',     endDrag);
  menuBtn.addEventListener('pointercancel', endDrag);

  // Click (no drag) toggles the menu.
  menuBtn.addEventListener('click', function (e) {
    if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; return; }
    setMenu(!document.body.classList.contains('is-nav-open'));
  });

  // Keep the pill in bounds when the viewport resizes.
  function reclamp() {
    if (!mqDesktop.matches || !menuBtn.classList.contains('is-placed')) return;
    var x = clampX(menuBtn.getBoundingClientRect().left);
    applyX(x);
    saveX(x);
  }
  window.addEventListener('resize', function () {
    reclamp();
    if (document.body.classList.contains('is-nav-open')) positionDropdown();
  }, { passive: true });

  // When the viewport crosses the mobile/desktop breakpoint, reset the
  // mobile placement so the CSS !important rules take hold cleanly.
  mqDesktop.addEventListener('change', function (e) {
    if (e.matches) {
      var x = loadX();
      if (x != null) applyX(clampX(x));
    } else {
      menuBtn.classList.remove('is-placed');
      menuBtn.style.left = '';
      menuBtn.style.top  = '';
    }
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
  var CUE_HIDE_AT  = 60;        // px of scroll before the "Scroll" cue fades
  var isScrolled   = false;
  var ticking      = false;
  var scrollTop    = document.querySelector('.scroll-top');
  var scrollCue    = document.querySelector('.home-scroll-cue');

  // Scroll-direction state — body.is-scrolling-down is flipped on
  // every scroll frame so UNESCO's left-side credit (and open nav
  // titles) can fade out on down-scroll and fade back in on up-scroll.
  var lastScrollY   = window.scrollY;
  var scrollDir     = 'up';
  var SCROLL_DELTA  = 6;    // px — ignore jitter below this

  function update() {
    var y = window.scrollY;

    // Direction tracking — only flip when movement exceeds the delta
    // and we're past the very top of the page.
    if (Math.abs(y - lastScrollY) >= SCROLL_DELTA) {
      var dir = (y > lastScrollY && y > 24) ? 'down' : 'up';
      if (dir !== scrollDir) {
        scrollDir = dir;
        document.body.classList.toggle('is-scrolling-down', dir === 'down');
      }
      lastScrollY = y;
    }
    // Always treat the very top of the page as "up" so the credit is
    // visible on load.
    if (y <= 24 && scrollDir !== 'up') {
      scrollDir = 'up';
      document.body.classList.remove('is-scrolling-down');
    }

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

    if (scrollTop) {
      var nearBottom = (max > 0) && (max - y) < window.innerHeight * 0.75;
      scrollTop.classList.toggle('is-visible', nearBottom);
    }
    if (scrollCue) {
      // Hero "Scroll" cue retreats once the user has moved past the
      // top of the page — its job was to invite the first scroll.
      scrollCue.classList.toggle('is-hidden', y > CUE_HIDE_AT);
    }

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

  // ---- Click ping -------------------------------------------------------
  // Brief cyan ring at the pointer location on any click, so viewers get
  // a clear visual confirmation that their tap / click was received. The
  // ring is pointer-events: none and is removed after its animation ends.
  // Keyboard-synthesised clicks (Enter/Space on a button) typically ship
  // clientX/Y === 0; those are skipped so nothing ever flashes in the
  // top-left corner on a keyboard action.
  var pingStyle = document.createElement('style');
  pingStyle.textContent =
    '.site-click-ping{' +
      'position:fixed;pointer-events:none;' +
      /* +15% from 17px → 20px for a slightly more visible glow;
         margin centres the ring on the cursor. */
      'width:20px;height:20px;margin:-10px 0 0 -10px;' +
      'border:2px solid #34dede;border-radius:50%;' +
      'opacity:1;transform:scale(0.35);' +
      'z-index:2147483646;' +
      'animation:site-click-ping 520ms cubic-bezier(0.2,0.8,0.2,1) forwards;' +
      'will-change:transform,opacity,filter;' +
      /* Blur scales with size (+15%): 8.4 → 9.7px — still a soft haze. */
      'filter:blur(9.7px);' +
    '}' +
    '@keyframes site-click-ping{' +
      '0%{opacity:1;transform:scale(0.35);}' +
      '70%{opacity:0.7;}' +
      '100%{opacity:0;transform:scale(1.8);}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){' +
      '.site-click-ping{animation-duration:220ms;}' +
    '}';
  document.head.appendChild(pingStyle);

  document.addEventListener('click', function (e) {
    if (!e.clientX && !e.clientY) return;   // keyboard-synthesised
    var ping = document.createElement('span');
    ping.className = 'site-click-ping';
    ping.setAttribute('aria-hidden', 'true');
    ping.style.left = e.clientX + 'px';
    ping.style.top  = e.clientY + 'px';
    document.body.appendChild(ping);
    ping.addEventListener('animationend', function () {
      if (ping.parentNode) ping.parentNode.removeChild(ping);
    });
  }, true);
})();
