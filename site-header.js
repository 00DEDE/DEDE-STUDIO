(function () {
  // Highlight the current page in the nav.
  var path = (location.pathname.split('/').pop() || 'home.html').toLowerCase();
  document.querySelectorAll('.site-header__nav a').forEach(function (a) {
    if (a.getAttribute('href').toLowerCase() === path) {
      a.classList.add('is-current');
    }
  });

  // Once the user scrolls a little, the header lifts off the top and rounds
  // into a floating pill. Passive scroll listener so it never blocks paint.
  var header = document.querySelector('.site-header');
  if (!header) return;
  var THRESHOLD = 20;
  function update() {
    if (window.scrollY > THRESHOLD) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
