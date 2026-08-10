import { createWorldScene } from './world-scene.js';
import { isWebGLAvailable, showStaticFallback } from './fallback.js';
import { dataSaver } from '../js/utils/motion-prefs.js';
import skinUrl from '../assets/minecraft-skin.png';

// Resolves to the world handle ({ dispose, camera }), or null when a
// fallback was shown instead (no WebGL, data-saver, or scene construction
// failed). `onStationChange(progress, engaged)` fires every frame the
// cinematic camera is active — main.js uses it to drive world-panels.js
// and nav-visibility.js in step with the camera.
export async function init(container, options) {
  if (!container) return null;

  if (dataSaver || !isWebGLAvailable()) {
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }

  try {
    return await createWorldScene(container, skinUrl, options);
  } catch (e) {
    container.replaceChildren();
    showStaticFallback(container, '/codevamp-logo.png');
    return null;
  }
}
