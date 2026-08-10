import { createModalidadScene } from '../three/modalidad-scene.js';
import { isWebGLAvailable, showStaticFallback } from '../three/fallback.js';
import { dataSaver } from './utils/motion-prefs.js';
import { PORTFOLIO_ITEMS } from '../three/portfolio-items.js';

// Resolves to the stage handle, or null on fallback — same contract as
// hero-voxel.js / cta-voxel.js.
export async function init() {
  const stageContainer = document.getElementById('modalidad-voxel');
  const prevBtn = document.getElementById('modalidad-prev');
  const nextBtn = document.getElementById('modalidad-next');
  const countEl = document.getElementById('modalidad-count');
  const titleEl = document.getElementById('modalidad-title');
  const descEl = document.getElementById('modalidad-desc');
  if (!stageContainer) return null;

  function renderPanel(index) {
    const item = PORTFOLIO_ITEMS[index];
    const n = PORTFOLIO_ITEMS.length;
    if (countEl) countEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;
  }

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(stageContainer, '/codevamp-logo.png');
    renderPanel(0);
    return null;
  }

  let scene;
  try {
    scene = await createModalidadScene(stageContainer);
  } catch (e) {
    stageContainer.replaceChildren();
    showStaticFallback(stageContainer, '/codevamp-logo.png');
    renderPanel(0);
    return null;
  }

  renderPanel(0);

  let navigating = false;
  async function go(delta) {
    if (navigating) return; // ignore rapid double-clicks mid-transition
    navigating = true;
    try {
      await scene.setItem(scene.getCurrentIndex() + delta);
      renderPanel(scene.getCurrentIndex());
    } finally {
      navigating = false;
    }
  }

  prevBtn?.addEventListener('click', () => go(-1));
  nextBtn?.addEventListener('click', () => go(1));

  return scene;
}
