import { reduceMotion } from './utils/motion-prefs.js';

// The grand climax: after the seal finishes assembling and has a brief
// quiet moment, everything surges together — a bigger burst than any
// single piece before it — and settles into a permanently brighter,
// "charged" state instead of returning to where it started.
export function init() {
  const portrait = document.querySelector('.hero-portrait');
  const dial = document.querySelector('.portrait-dial');
  const ring = document.querySelector('.dot-ring');
  const dialProgress = document.getElementById('dial-progress');
  const shockwave = document.getElementById('shockwave');
  if (!portrait || reduceMotion) {
    if (dial) dial.classList.add('charged');
    if (ring) ring.classList.add('charged');
    return;
  }

  function fireShockwave() {
    if (!shockwave) return;
    shockwave.classList.remove('active');
    void shockwave.offsetWidth; // restart the animation
    shockwave.classList.add('active');
  }

  function grandBurst() {
    const symbols = ['ᚲ', '火', '▲'];
    const waves = [
      { count: 16, dist: [40, 65], delay: 0 },
      { count: 12, dist: [70, 100], delay: 220 },
      { count: 8, dist: [100, 120], delay: 480 }
    ];
    waves.forEach(wave => {
      setTimeout(() => {
        for (let i = 0; i < wave.count; i++) {
          const angle = (Math.PI * 2 * i) / wave.count + Math.random() * 0.4;
          const dist = wave.dist[0] + Math.random() * (wave.dist[1] - wave.dist[0]);
          const p = document.createElement('span');
          p.className = 'spark-burst';
          p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
          p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
          p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
          portrait.appendChild(p);
          setTimeout(() => p.remove(), 1050);
        }
      }, wave.delay);
    });
  }

  // Brief pause right after the spark completes its lap, before the release.
  setTimeout(() => {
    portrait.classList.add('climax');
    fireShockwave();
    setTimeout(fireShockwave, 350);
    if (dialProgress) {
      dialProgress.classList.add('ring-flash');
      setTimeout(() => {
        dialProgress.classList.remove('ring-flash');
        dialProgress.classList.add('charged-pulse');
      }, 900);
    }
    grandBurst();
    setTimeout(() => {
      if (dial) dial.classList.add('charged');
      if (ring) ring.classList.add('charged');
    }, 500);
  }, 4650);
}
