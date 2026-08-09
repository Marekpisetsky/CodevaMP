import { reduceMotion } from './utils/motion-prefs.js';

// Hidden power easter egg: hold the portrait for a second and the
// chaotic power Codeva doesn't know he has flickers through in purple,
// then fades back to red — a secret tied directly to the lore, not
// meant to be obvious. Cancels itself the moment the finger moves,
// so it never fires mid-scroll, and blocks the native long-press menu.
export function init() {
  const portrait = document.querySelector('.hero-portrait');
  const dial = document.getElementById('dial-progress');
  const spark = document.getElementById('dial-spark');
  const flash = document.getElementById('chaos-flash');
  const ringOuter = document.querySelector('.dot-ring');
  const ringInner = document.querySelector('.portrait-dial');
  if (!portrait || !dial) return;

  const HOLD_MS = 950;
  let holdTimer = null;
  let holdStartX = 0, holdStartY = 0;

  function reveal() {
    dial.classList.remove('charging');
    dial.classList.add('chaos');
    if (spark) spark.classList.add('chaos');
    if (flash) flash.classList.add('active');
    if (ringOuter) ringOuter.classList.add('chaos-mode');
    if (ringInner) ringInner.classList.add('chaos-mode');
    chaosBurst();
    setTimeout(() => {
      dial.classList.remove('chaos');
      if (spark) spark.classList.remove('chaos');
      if (flash) flash.classList.remove('active');
      if (ringOuter) ringOuter.classList.remove('chaos-mode');
      if (ringInner) ringInner.classList.remove('chaos-mode');
    }, 1400);
  }

  function chaosBurst() {
    if (!portrait) return;
    const symbols = ['ᚲ', '火', '▲'];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const dist = 35 + Math.random() * 30;
      const p = document.createElement('span');
      p.className = 'spark-burst';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.color = 'var(--chaos)';
      p.style.textShadow = '0 0 4px var(--chaos), 0 0 10px rgba(124,42,232,0.9)';
      p.style.setProperty('--bx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--by', (Math.sin(angle) * dist).toFixed(1) + 'px');
      portrait.appendChild(p);
      setTimeout(() => p.remove(), 1050);
    }
  }

  function startHold(e) {
    clearTimeout(holdTimer);
    holdStartX = e.clientX;
    holdStartY = e.clientY;
    dial.classList.add('charging');
    if (ringOuter) ringOuter.classList.add('chaos-mode');
    if (ringInner) ringInner.classList.add('chaos-mode');
    holdTimer = setTimeout(reveal, reduceMotion ? 0 : HOLD_MS);
  }
  function cancelHold() {
    clearTimeout(holdTimer);
    if (dial.classList.contains('charging')) {
      dial.classList.remove('charging');
      if (ringOuter) ringOuter.classList.remove('chaos-mode');
      if (ringInner) ringInner.classList.remove('chaos-mode');
    }
  }
  function checkMove(e) {
    if (Math.abs(e.clientX - holdStartX) > 10 || Math.abs(e.clientY - holdStartY) > 10) {
      cancelHold();
    }
  }

  portrait.addEventListener('pointerdown', startHold);
  portrait.addEventListener('pointermove', checkMove);
  portrait.addEventListener('pointerup', cancelHold);
  portrait.addEventListener('pointerleave', cancelHold);
  portrait.addEventListener('pointercancel', cancelHold);
  portrait.addEventListener('contextmenu', (e) => e.preventDefault());
}
