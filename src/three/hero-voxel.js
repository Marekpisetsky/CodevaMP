import { createWorldScene } from './world-scene.js';
import { isWebGLAvailable, showStaticFallback } from './fallback.js';
import { dataSaver } from '../js/utils/motion-prefs.js';
import skinUrl from '../assets/minecraft-skin.png';

// Resolves to the world handle ({ dispose, camera }), or null when a
// fallback was shown instead (no WebGL, data-saver, or scene construction
// failed). The hero is no longer one of scroll-orchestrator's independent
// per-section stages (see plan: mundo 3D continuo) — it owns its own
// static-for-now camera, no setFocus hook.
export async function init(container) {
  if (!container) return null;

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }

  try {
    return await createWorldScene(container, skinUrl);
  } catch (e) {
    container.replaceChildren();
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }
}
