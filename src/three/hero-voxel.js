import { createHeroScene } from './scene.js';
import { isWebGLAvailable, showStaticFallback } from './fallback.js';
import { dataSaver } from '../js/utils/motion-prefs.js';
import skinUrl from '../assets/minecraft-skin.png';

export async function init(container) {
  if (!container) return;

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(container, '/codevamp-logo.png');
    return;
  }

  try {
    await createHeroScene(container, skinUrl);
  } catch (e) {
    container.replaceChildren();
    showStaticFallback(container, '/codevamp-logo.png');
  }
}
