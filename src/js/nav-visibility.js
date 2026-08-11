import { reduceMotion, hoverCapable } from './utils/motion-prefs.js';

// Hides the nav for the entire cinematic hero sequence — no hover reveal.
// Per feedback: "todo integrado sin nav bar" means fully gone while
// scroll-jacked, not peeking back in on mouse proximity to the top edge.
// It reappears once the sequence hands off to native scroll (footer).
// Under reduceMotion the cinematic sequence never runs at all (world-
// scene.js never constructs virtual-scroll), so nav-visibility does
// nothing and the nav just stays visible like a normal page. Same for
// touch devices (!hoverCapable) — with no way to reveal it again short of
// scrolling all the way past, hiding it there would strand touch users
// with no way to reach "Suscribirme"/"Modalidades".
export function createNavVisibility(nav) {
  if (reduceMotion || !hoverCapable || !nav) {
    return { setEngaged() {} };
  }

  function setEngaged(engaged) {
    nav.classList.toggle('is-hidden', engaged);
  }

  return { setEngaged };
}
