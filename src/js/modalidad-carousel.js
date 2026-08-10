import { PORTFOLIO_ITEMS } from '../three/portfolio-items.js';

// Wires the prev/next buttons and text panel — the 3D object itself lives
// in the shared world now (world-scene.js's modalidadGroup, Fase 5), not a
// separate canvas here. `worldHandle` is the object hero-voxel.js's init()
// resolves to ({ setModalidadItem, getModalidadIndex, ... }), or null if
// the world never rendered (no WebGL / data-saver / reduceMotion fallback
// already handled upstream) — text still cycles on its own in that case,
// just without any 3D to swap alongside it.
export function init(worldHandle) {
  const prevBtn = document.getElementById('modalidad-prev');
  const nextBtn = document.getElementById('modalidad-next');
  const countEl = document.getElementById('modalidad-count');
  const titleEl = document.getElementById('modalidad-title');
  const descEl = document.getElementById('modalidad-desc');

  function renderPanel(index) {
    const item = PORTFOLIO_ITEMS[index];
    const n = PORTFOLIO_ITEMS.length;
    if (countEl) countEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;
  }

  let textIndex = 0;
  renderPanel(0);

  let navigating = false;
  async function go(delta) {
    if (navigating) return; // ignore rapid double-clicks mid-transition
    navigating = true;
    try {
      if (worldHandle) {
        textIndex = await worldHandle.setModalidadItem(worldHandle.getModalidadIndex() + delta);
      } else {
        textIndex = ((textIndex + delta) % PORTFOLIO_ITEMS.length + PORTFOLIO_ITEMS.length) % PORTFOLIO_ITEMS.length;
      }
      renderPanel(textIndex);
    } finally {
      navigating = false;
    }
  }

  prevBtn?.addEventListener('click', () => go(-1));
  nextBtn?.addEventListener('click', () => go(1));
}
