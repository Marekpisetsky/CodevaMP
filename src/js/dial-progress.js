import { reduceMotion } from './utils/motion-prefs.js';

// Portrait dial: the progress arc draws itself once, fully, shortly after
// the page loads — guaranteed visible regardless of scroll speed, instead
// of racing against the portrait scrolling out of view. A spark travels
// the arc as it draws, and a small ember burst fires when it completes.
export function init() {
  const dial = document.getElementById('dial-progress');
  const spark = document.getElementById('dial-spark');
  const portrait = document.querySelector('.hero-portrait');
  if (!dial) return;

  if (reduceMotion) {
    dial.style.strokeDashoffset = '50.82';
    dial.classList.add('fill');
    return;
  }

  const CIRCUMFERENCE = 703.72;
  const CX = 120, CY = 120, R = 112;
  const DURATION = 1800;
  const DRAWN_FRACTION = 334 / 360; // leaves a ~26deg permanent gap: the Grieta

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function fireBurst() {
    if (!portrait) return;
    const symbols = ['ᚲ','火','▲'];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const dist = 30 + Math.random() * 20;
      const p = document.createElement('span');
      p.className = 'spark-burst';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
      portrait.appendChild(p);
      setTimeout(() => p.remove(), 1050);
    }
  }

  function animate(startTime) {
    const now = performance.now();
    const t = Math.min(1, (now - startTime) / DURATION);
    const eased = easeOutCubic(t);
    const drawnEased = eased * DRAWN_FRACTION;

    dial.style.strokeDashoffset = (CIRCUMFERENCE * (1 - drawnEased)).toFixed(2);

    if (spark) {
      const angleDeg = -90 + drawnEased * 360;
      const angleRad = angleDeg * Math.PI / 180;
      spark.setAttribute('cx', (CX + R * Math.cos(angleRad)).toFixed(2));
      spark.setAttribute('cy', (CY + R * Math.sin(angleRad)).toFixed(2));
      if (t > 0 && t < 1) spark.classList.add('active');
    }

    if (t < 1) {
      requestAnimationFrame(() => animate(startTime));
    } else {
      dial.classList.add('fill');
      if (spark) spark.classList.remove('active');
      fireBurst();
    }
  }

  // Small delay so it starts after the fonts-ready fade-in, not during it.
  setTimeout(() => {
    requestAnimationFrame((t) => animate(t));
  }, 500);
}
