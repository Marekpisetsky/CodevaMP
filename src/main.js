import './style/site.css';
import { dataSaver } from './js/utils/motion-prefs.js';

import * as youtubeSubs from './js/youtube-subs.js';
import * as youtubeLatestVideos from './js/youtube-latest-videos.js';
import * as featuredVideo from './js/featured-video.js';
import * as igniteText from './js/ignite-text.js';
import * as tabTitle from './js/tab-title.js';
import * as preloader from './js/preloader.js';
import * as glitchText from './js/glitch-text.js';
import * as scrollReveal from './js/scroll-reveal.js';
import * as counters from './js/counters.js';
import * as pointerInteractions from './js/pointer-interactions.js';
import * as emberTrail from './js/ember-trail.js';
import * as heroVoxel from './three/hero-voxel.js';
import * as videoVoxel from './three/video-voxel.js';
import * as modalidadCarousel from './js/modalidad-carousel.js';
import { createWorldPanels } from './js/world-panels.js';

youtubeSubs.init();
youtubeLatestVideos.init();
featuredVideo.init();
igniteText.init();
tabTitle.init();
preloader.init();

// Respect data-saver mode: skip purely decorative texture for people on limited data.
if (dataSaver) {
  document.documentElement.classList.add('data-saver');
}

glitchText.init();
scrollReveal.init();
counters.init();
pointerInteractions.init();
emberTrail.init();

// destacado still builds its own small canvas (video-voxel.js, on the
// older stage.js pipeline) — mounted inside a fixed world-panel overlay,
// cross-faded in step with the hero's cinematic camera (world-panels.js)
// rather than scrolled past. Modalidades' and the CTA's (the Bedwars bed)
// objects both live in the shared world itself now — modalidad-carousel.js
// just wires its prev/next buttons to whatever the world hands back below.
videoVoxel.init(document.getElementById('video-voxel'));

// 4 stations total (hero/destacado/modalidades/cta) — must match
// world-scene.js's `stations` array length, even though only 2 of them
// still have a DOM panel to cross-fade (hero and cta are pure 3D now).
const worldPanels = createWorldPanels(document.querySelectorAll('[data-station]'), 4);

heroVoxel.init(document.getElementById('hero-voxel'), {
  onStationChange(progress, engaged) {
    worldPanels.apply(progress, engaged);
  },
}).then((worldHandle) => {
  modalidadCarousel.init(worldHandle);
});
