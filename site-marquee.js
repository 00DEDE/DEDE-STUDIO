/* Cursor-tracking spotlight for every .marquee-band on the page.
   Updates --mx / --my on the sharp overlay so its radial mask centres
   on the pointer, locally revealing the sharp copy over the blurred
   base. Skipped on touch — there's no cursor to track and the CSS
   default (-1000px, -1000px) already hides the sharp layer. */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.marquee-band').forEach((band) => {
    const sharp = band.querySelector('.marquee-band__sharp');
    if (!sharp) return;
    band.addEventListener('mousemove', (e) => {
      const rect = band.getBoundingClientRect();
      sharp.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      sharp.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
    band.addEventListener('mouseleave', () => {
      sharp.style.setProperty('--mx', '-1000px');
      sharp.style.setProperty('--my', '-1000px');
    });
  });
})();
