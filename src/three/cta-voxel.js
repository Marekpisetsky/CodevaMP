import { createCtaScene } from './cta-scene.js';
import { isWebGLAvailable, showStaticFallback } from './fallback.js';
import { dataSaver } from '../js/utils/motion-prefs.js';
import skinUrl from '../assets/minecraft-skin.png';

// Mirrors hero-voxel.js's init() contract: resolves to the stage handle for
// scroll-orchestrator.js registration, or null when a fallback was shown.
export async function init(container) {
  if (!container) return null;

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }

  try {
    return await createCtaScene(container, skinUrl);
  } catch (e) {
    container.replaceChildren();
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }
}
