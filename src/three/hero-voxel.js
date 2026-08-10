import { createHeroScene } from './scene.js';
import { isWebGLAvailable, showStaticFallback } from './fallback.js';
import { dataSaver } from '../js/utils/motion-prefs.js';
import skinUrl from '../assets/minecraft-skin.png';

// Resolves to the stage handle ({ dispose, setFocus, camera }) so callers
// can register it with scroll-orchestrator.js, or null when a fallback was
// shown instead (no WebGL, data-saver, or scene construction failed).
export async function init(container) {
  if (!container) return null;

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }

  try {
    return await createHeroScene(container, skinUrl);
  } catch (e) {
    container.replaceChildren();
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }
}
