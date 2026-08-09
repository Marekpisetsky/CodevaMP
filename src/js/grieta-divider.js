import { reduceMotion } from './utils/motion-prefs.js';

// Grieta divider: the crack draws itself open the first time it scrolls
// into view, with a small ember burst where it finishes.
export function init() {
  const crack = document.getElementById('grieta-crack');
  if (!crack || !('IntersectionObserver' in window)) return;

  function burstAt(container) {
    if (!container || reduceMotion) return;
    const symbols = ['ᚲ','火','▲'];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'spark-burst';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 14;
      p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
      p.style.left = '50%';
      p.style.top = '50%';
      container.appendChild(p);
      setTimeout(() => p.remove(), 1050);
    }
  }

  const cio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        crack.classList.add('open');
        const wrap = crack.closest('.grieta-divider');
        if (wrap) {
          wrap.style.position = 'relative';
          setTimeout(() => burstAt(wrap), reduceMotion ? 0 : 1300);
        }
        cio.unobserve(crack);
      }
    });
  }, { threshold: 0.5 });
  cio.observe(crack);
}
