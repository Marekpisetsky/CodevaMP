// Scroll-jacking for the hero's cinematic camera: wheel/touch input drives
// a virtual progress value instead of scrolling the real page — the only
// way to get a non-linear camera path (pull back before advancing) and an
// auto-completing snap when the user lets go mid-transition. Progress
// wraps in both directions (camera-rig.js's interpolation is fully
// modulo-based) — there's nothing on the page to hand off to anymore (no
// nav, no footer, nothing past .hero's own 100vh), so scrolling never
// actually moves the real page at all, in either direction.
//
// This is an invasive technique — see the plan's explicit callout that the
// accessibility fallback isn't optional. Callers must not construct this
// at all when `reduceMotion` is set; the page then behaves as a completely
// normal scrolling document, which is the real fallback, not a defensive
// try/catch here.
const SENSITIVITY = 0.0016;
const TOUCH_SENSITIVITY = 0.0032;
// The settle-to-center isn't instant: wait a couple seconds of no input
// before easing in, then ease in slowly rather than snapping — DAMPING_ACTIVE
// governs the responsive follow while input is still coming in.
const SETTLE_DELAY_MS = 2200;
const DAMPING_ACTIVE = 5.5;
const DAMPING_SETTLE = 1.6;

export function createVirtualScroll({ pinTarget, stationCount, onProgress }) {
  let rawProgress = 0;
  let displayProgress = 0;
  let settled = false;
  let settleTimer = null;

  function scheduleSettle() {
    settled = false;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      // Deliberately not wrapped into [0, stationCount) here — rawProgress
      // is left to grow/shrink without bound. camera-rig.js already wraps
      // internally for rendering, so wrapping again here bought nothing
      // except a bug: displayProgress's easing below is a plain linear
      // difference, and snapping rawProgress from e.g. 3.8 down to 0 makes
      // it ease the "long way around" backward through every station
      // instead of continuing forward past the wrap point.
      rawProgress = Math.round(rawProgress);
      settled = true;
    }, SETTLE_DELAY_MS);
  }

  function advance(deltaY) {
    rawProgress += deltaY * SENSITIVITY;
    scheduleSettle();
  }

  function onWheel(e) {
    e.preventDefault();
    advance(e.deltaY);
  }

  let touchStartY = null;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (touchStartY === null) return;
    e.preventDefault();
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    advance(dy * (TOUCH_SENSITIVITY / SENSITIVITY));
  }
  function onTouchEnd() {
    touchStartY = null;
  }

  pinTarget.classList.add('is-pinned'); // permanent — nothing to unpin for anymore

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  function update(dt) {
    const damping = settled ? DAMPING_SETTLE : DAMPING_ACTIVE;
    displayProgress += (rawProgress - displayProgress) * (1 - Math.exp(-damping * dt));
    onProgress(displayProgress, true);
  }

  function dispose() {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    if (settleTimer) clearTimeout(settleTimer);
    pinTarget.classList.remove('is-pinned');
  }

  return { update, dispose };
}
