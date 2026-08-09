import { reduceMotion, dataSaver, hoverCapable } from './utils/motion-prefs.js';

// Cursor ember trail: small embers spawn as the mouse moves across the
// whole page, drift up and fade — the fire following where you look.
export function init() {
  const canvas = document.getElementById('ember-trail');
  if (!canvas || reduceMotion || dataSaver || !hoverCapable) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf = null;
  let lastSpawn = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn(x, y) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.4 - Math.random() * 0.5,
      r: 1 + Math.random() * 1.8,
      life: 1,
      decay: 0.012 + Math.random() * 0.01
    });
    if (particles.length > 120) particles.shift();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      const a = Math.max(0, p.life) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 52, 42, ${a})`;
      ctx.shadowColor = 'rgba(232, 52, 42, 0.7)';
      ctx.shadowBlur = 5;
      ctx.fill();
    });
    if (particles.length > 0 && !document.hidden) {
      raf = requestAnimationFrame(draw);
    } else {
      raf = null;
    }
  }

  function ensureLoop() {
    if (!raf) raf = requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastSpawn > 24) {
      lastSpawn = now;
      spawn(e.clientX, e.clientY);
      ensureLoop();
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) ensureLoop();
  });
}
