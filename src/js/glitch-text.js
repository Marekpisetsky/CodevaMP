import { reduceMotion } from './utils/motion-prefs.js';

// Glitch-decode text: labels scramble through random terminal characters
// before resolving to their real text, the first time they scroll into view.
export function init() {
  const targets = document.querySelectorAll('.glitch-text');
  if (!targets.length) return;

  const CHARS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  const DURATION = 800;

  function decode(el) {
    const final = el.textContent;
    const len = final.length;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / DURATION);
      const revealCount = Math.floor(t * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        if (i < revealCount || final[i] === ' ') {
          out += final[i];
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = out;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = final;
        el.classList.add('resolve-flash');
        setTimeout(() => el.classList.remove('resolve-flash'), 500);
      }
    }
    requestAnimationFrame(frame);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const gio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        decode(entry.target);
        gio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  targets.forEach(el => gio.observe(el));
}
