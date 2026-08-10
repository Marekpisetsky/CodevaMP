import { reduceMotion, hoverCapable } from './utils/motion-prefs.js';

// Magnetic buttons + hero parallax/cursor-glow.
// Both share one hover:hover / reduced-motion guard.
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
