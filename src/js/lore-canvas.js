import { reduceMotion, dataSaver } from './utils/motion-prefs.js';

// Ember particles in the lore section
export function init() {
  const canvas = document.getElementById('lore-canvas');
  if (!canvas || reduceMotion || dataSaver) return;
  const ctx = canvas.getContext('2d');
  const section = canvas.parentElement;
  let particles = [];
  let raf;
  let visible = true;

  function resize() {
    canvas.width = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 40,
      r: 1 + Math.random() * 2.2,
      speed: 0.25 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: 0.15 + Math.random() * 0.35,
      flicker: Math.random() * Math.PI * 2
    };
  }

  function initParticles() {
    resize();
    const count = Math.max(14, Math.floor(canvas.width / 90));
    particles = Array.from({ length: count }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      p.flicker += 0.05;
      if (p.y < -10) Object.assign(p, makeParticle(), { y: canvas.height + 10 });
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 52, 42, ${a})`;
      ctx.shadowColor = 'rgba(232, 52, 42, 0.6)';
      ctx.shadowBlur = 5;
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initParticles, 200);
  });

  // Pause the animation loop entirely when the tab is hidden,
  // so it doesn't burn battery/CPU in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (visible && !raf) {
      draw();
    }
  });

  const lio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) {
        initParticles();
        if (!raf) draw();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    });
  }, { threshold: 0.05 });
  lio.observe(section);
}
