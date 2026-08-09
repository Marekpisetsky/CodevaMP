import { reduceMotion } from './utils/motion-prefs.js';

// Opening seal: the ring draws itself, the mark reveals, then the
// dashes fade in — the loading screen is the brand's own signature,
// not a generic spinner. It plays in the background and never blocks
// the page from revealing as soon as it's actually ready.
export function init() {
  const preloader = document.getElementById('preloader');
  const preloaderDashes = document.getElementById('preloader-dashes');
  const sealRing = document.getElementById('seal-ring');
  const sealMark = document.querySelector('.seal-mark');

  if (sealRing && !reduceMotion) {
    requestAnimationFrame(() => sealRing.classList.add('draw'));
  }
  if (sealMark) {
    setTimeout(() => sealMark.classList.add('show'), reduceMotion ? 0 : 1300);
  }

  let dashInterval;
  if (preloaderDashes && !reduceMotion) {
    setTimeout(() => preloaderDashes.classList.add('show'), 1500);
    const frames = ['- - -', '- - - =', '- - - = =', '- - - = = +', '- - = = + =', '- = = + = =', '= = + = = -'];
    let f = 0;
    dashInterval = setInterval(() => {
      preloaderDashes.textContent = frames[f % frames.length];
      f++;
    }, 90);
  } else if (preloaderDashes) {
    preloaderDashes.textContent = 'CodevaMP';
    preloaderDashes.classList.add('show');
  }

  // Reveal the page as soon as fonts are ready — never force a wait.
  // The seal keeps animating in the background regardless; if the page
  // reveals before it finishes, that's fine, it just plays out behind.
  function markReady() {
    document.body.classList.add('fonts-ready');
    if (preloader) {
      preloader.classList.add('done');
      // Fully remove it from the DOM once its fade-out finishes, instead
      // of leaving an invisible position:fixed full-screen layer sitting
      // around for the rest of the page's life.
      setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 600);
    }
    if (dashInterval) clearInterval(dashInterval);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(markReady).catch(markReady);
    setTimeout(markReady, 1200); // safety net if fonts.ready never resolves
  } else {
    setTimeout(markReady, 100);
  }
}
