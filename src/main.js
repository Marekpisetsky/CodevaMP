import './style/site.css';
import { dataSaver } from './js/utils/motion-prefs.js';

import * as youtubeSubs from './js/youtube-subs.js';
import * as youtubeLatestVideos from './js/youtube-latest-videos.js';
import * as featuredVideo from './js/featured-video.js';
import * as igniteText from './js/ignite-text.js';
import * as tabTitle from './js/tab-title.js';
import * as preloader from './js/preloader.js';
import * as navScroll from './js/nav-scroll.js';
import * as glitchText from './js/glitch-text.js';
import * as scrollReveal from './js/scroll-reveal.js';
import * as counters from './js/counters.js';
import * as pointerInteractions from './js/pointer-interactions.js';
import * as emberTrail from './js/ember-trail.js';
import * as heroVoxel from './three/hero-voxel.js';
import * as ctaVoxel from './three/cta-voxel.js';
import * as videoVoxel from './three/video-voxel.js';
import * as modalidadCarousel from './js/modalidad-carousel.js';
import { createWorldPanels } from './js/world-panels.js';
import { createNavVisibility } from './js/nav-visibility.js';

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

navScroll.init();
glitchText.init();
scrollReveal.init();
counters.init();
pointerInteractions.init();
emberTrail.init();

// destacado/cta build their own small canvases same as before
// (video-voxel.js/cta-voxel.js, still on the older stage.js pipeline) —
// they're just mounted inside fixed world-panel overlays now instead of
// normal-flow sections, cross-faded in step with the hero's cinematic
// camera (world-panels.js) rather than scrolled past. Modalidades' object
// lives in the shared world itself (Fase 5) — modalidad-carousel.js just
// wires its prev/next buttons to whatever the world hands back below.
ctaVoxel.init(document.getElementById('cta-voxel'));
videoVoxel.init(document.getElementById('video-voxel'));

const worldPanels = createWorldPanels(document.querySelectorAll('[data-station]'));
const navVisibility = createNavVisibility(document.getElementById('main-nav'));

heroVoxel.init(document.getElementById('hero-voxel'), {
  onStationChange(progress, engaged) {
    worldPanels.apply(progress, engaged);
    navVisibility.setEngaged(engaged);
  },
}).then((worldHandle) => {
  modalidadCarousel.init(worldHandle);
});
