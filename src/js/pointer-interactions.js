import { reduceMotion, hoverCapable } from './utils/motion-prefs.js';

// Magnetic buttons + 3D tilt on game-mode cards + hero parallax/cursor-glow.
// All three share one hover:hover / reduced-motion guard.
export function init() {
  if (reduceMotion || !hoverCapable) return;

  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  // 3D tilt + glare on the game-mode cards
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const tiltX = (py - 0.5) * -8;
      const tiltY = (px - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Subtle hero parallax + cursor-following glow
  const heroStripe = document.querySelector('.hero-stripe');
  const heroGlow = document.getElementById('hero-glow');
  const heroSection = document.querySelector('.hero');
  if (heroStripe && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      heroStripe.style.transform = `translate(${relX * 24}px, ${relY * 16}px)`;
      if (heroGlow) {
        heroGlow.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        heroGlow.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }
    });
    heroSection.addEventListener('mouseleave', () => { heroStripe.style.transform = ''; });
  }
}
