import { reduceMotion } from './utils/motion-prefs.js';

// Sticky nav background on scroll + back-to-top visibility + progress ring
export function init() {
  const nav = document.getElementById('main-nav');
  const backToTop = document.getElementById('back-to-top');
  const bttRing = document.getElementById('btt-ring');
  const BTT_CIRCUMFERENCE = 125.66;
  function updateNavAndBtt() {
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (backToTop) {
      if (window.scrollY > 700) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    }
    if (bttRing) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      bttRing.style.strokeDashoffset = (BTT_CIRCUMFERENCE * (1 - pct)).toFixed(2);
    }
  }
  let navBttTicking = false;
  window.addEventListener('scroll', () => {
    if (navBttTicking) return;
    navBttTicking = true;
    requestAnimationFrame(() => {
      updateNavAndBtt();
      navBttTicking = false;
    });
  }, { passive: true });
  updateNavAndBtt();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
}
