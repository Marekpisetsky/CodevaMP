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
heroVoxel.init(document.getElementById('hero-voxel'));
