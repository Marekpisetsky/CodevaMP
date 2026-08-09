import { reduceMotion } from './utils/motion-prefs.js';

// Animated counters
function formatCounter(val, format) {
  if (format === 'k1') return (val / 1000).toFixed(1) + 'K';
  return Math.round(val).toString();
}
function animateCounter(el) {
  const target = parseFloat(el.dataset.value);
  const format = el.dataset.format;
  if (reduceMotion) { el.textContent = formatCounter(target, format); return; }
  const duration = 1100;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatCounter(target * eased, format);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function init() {
  const counters = document.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(el => el.textContent = formatCounter(parseFloat(el.dataset.value), el.dataset.format));
  }
}
