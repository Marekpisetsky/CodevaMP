import './style/site.css';
import { dataSaver } from './js/utils/motion-prefs.js';

import * as tabTitle from './js/tab-title.js';
import * as preloader from './js/preloader.js';
import * as pointerInteractions from './js/pointer-interactions.js';
import * as emberTrail from './js/ember-trail.js';
import * as heroVoxel from './three/hero-voxel.js';
import { createWorldPanels } from './js/world-panels.js';

tabTitle.init();
preloader.init();

// Respect data-saver mode: skip purely decorative texture for people on limited data.
if (dataSaver) {
  document.documentElement.classList.add('data-saver');
}

pointerInteractions.init();
emberTrail.init();

// 5 stations total (overview/destacado/modalidades/cta/hero) — must match
// world-scene.js's `stations` array length. No station has DOM content to
// cross-fade anymore (every station is pure 3D world now), so this
// currently has nothing to toggle — kept wired since it's the plumbing
// world-scene.js's camera-rig progress already flows through.
const worldPanels = createWorldPanels(document.querySelectorAll('[data-station]'), 5);

heroVoxel.init(document.getElementById('hero-voxel'), {
  onStationChange(progress, engaged) {
    worldPanels.apply(progress, engaged);
  },
});
