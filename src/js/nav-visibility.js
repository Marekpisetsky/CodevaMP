import { reduceMotion, hoverCapable } from './utils/motion-prefs.js';

const TOP_HOVER_ZONE = 90; // px from the top edge that reveals the nav

// Hides the nav by default while the cinematic hero sequence is engaged
// (scroll-jacked), reappearing on mouse proximity to the top edge — same
// minimal-chrome idea as igloo.inc's UI. Under reduceMotion the cinematic
// sequence never runs at all (world-scene.js never constructs
// virtual-scroll), so nav-visibility does nothing and the nav just stays
// visible like a normal page. Same for touch devices (!hoverCapable) —
// there's no hover gesture to reveal a hidden nav with, so hiding it would
// strand touch users with no way to get to "Suscribirme"/"Modalidades".
export function createNavVisibility(nav) {
  if (reduceMotion || !hoverCapable || !nav) {
    return { setEngaged() {}, dispose() {} };
  }

  let engaged = false;
  let hovering = false;

  function apply() {
    nav.classList.toggle('is-hidden', engaged && !hovering);
  }

  function setEngaged(next) {
    if (engaged === next) return;
    engaged = next;
    apply();
  }

  function onMouseMove(e) {
    const near = e.clientY < TOP_HOVER_ZONE;
    if (near !== hovering) {
      hovering = near;
      apply();
    }
  }
  window.addEventListener('mousemove', onMouseMove);

  function dispose() {
    window.removeEventListener('mousemove', onMouseMove);
  }

  return { setEngaged, dispose };
}
