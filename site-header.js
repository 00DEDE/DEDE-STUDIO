(function () {
  // Highlight the current page in the nav.
  var path = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
  document.querySelectorAll('.site-header__nav a').forEach(function (a) {
    if (a.getAttribute('href').toLowerCase() === path) {
      a.classList.add('is-current');
    }
  });

  // Toggle the pill state on scroll. Two perf choices here:
  // 1. requestAnimationFrame throttles the check to ≤60 checks/sec regardless
  //    of how fast the scroll event fires (some browsers dispatch it many
  //    times per frame).
  // 2. We only touch the DOM when the state actually flips, so classList.toggle
  //    isn't invalidating styles every scroll pixel.
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
})();
