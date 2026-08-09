import './style/site.css';
import { dataSaver } from './js/utils/motion-prefs.js';

import * as youtubeSubs from './js/youtube-subs.js';
import * as youtubeLatestVideos from './js/youtube-latest-videos.js';
import * as featuredVideo from './js/featured-video.js';
import * as igniteText from './js/ignite-text.js';
import * as chaosEasterEgg from './js/chaos-easter-egg.js';
import * as tabTitle from './js/tab-title.js';
import * as glossaryTooltips from './js/glossary-tooltips.js';
import * as preloader from './js/preloader.js';
import * as dialProgress from './js/dial-progress.js';
import * as grandClimax from './js/grand-climax.js';
import * as navScroll from './js/nav-scroll.js';
import * as grietaDivider from './js/grieta-divider.js';
import * as glitchText from './js/glitch-text.js';
import * as scrollReveal from './js/scroll-reveal.js';
import * as counters from './js/counters.js';
import * as pointerInteractions from './js/pointer-interactions.js';
import * as emberTrail from './js/ember-trail.js';
import * as loreCanvas from './js/lore-canvas.js';

youtubeSubs.init();
youtubeLatestVideos.init();
featuredVideo.init();
igniteText.init();
chaosEasterEgg.init();
tabTitle.init();
glossaryTooltips.init();
preloader.init();

// Respect data-saver mode: skip purely decorative texture for people on limited data.
if (dataSaver) {
  document.documentElement.classList.add('data-saver');
}

dialProgress.init();
grandClimax.init();
navScroll.init();
grietaDivider.init();
glitchText.init();
scrollReveal.init();
counters.init();
pointerInteractions.init();
emberTrail.init();
loreCanvas.init();
