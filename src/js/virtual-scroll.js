// Scroll-jacking for the hero's cinematic camera: while "engaged", wheel/
// touch/keyboard input drives a virtual progress value (0..stationCount-1)
// instead of scrolling the real page — the only way to get a non-linear
// camera path (pull back before advancing) and an auto-completing snap
// when the user lets go mid-transition, in either direction. Once progress
// reaches either end and the user keeps pushing past it, control is
// released back to native scroll so the rest of the page (destacado,
// modalidades, cta) scrolls normally beneath the pinned hero.
//
// This is an invasive technique — see the plan's explicit callout that the
// accessibility fallback isn't optional. Callers must not construct this
// at all when `reduceMotion` is set; the page then behaves as a completely
// normal scrolling document, which is the real fallback, not a defensive
// try/catch here.
const SENSITIVITY = 0.0016;
const TOUCH_SENSITIVITY = 0.0032;
const SETTLE_DELAY_MS = 160;
const DAMPING = 5.5;

export function createVirtualScroll({ pinTarget, stationCount, onProgress }) {
  let rawProgress = 0;
  let displayProgress = 0;
  let engaged = true;
  let settleTimer = null;

  function clamp(v) {
    return Math.max(0, Math.min(stationCount - 1, v));
  }

  function setEngaged(next) {
    if (engaged === next) return;
    engaged = next;
    pinTarget.classList.toggle('is-pinned', engaged);
  }

  function scheduleSettle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      rawProgress = Math.round(rawProgress);
    }, SETTLE_DELAY_MS);
  }

  function advance(deltaY) {
    const forward = deltaY > 0;
    if (forward && rawProgress >= stationCount - 1 - 0.001) {
      setEngaged(false);
      return false; // not consumed — let this scroll reach the real page
    }
    if (!forward && rawProgress <= 0.001) {
      return true; // consumed but no-op: nothing above the hero to reveal
    }
    rawProgress = clamp(rawProgress + deltaY * SENSITIVITY);
    scheduleSettle();
    return true;
  }

  function onWheel(e) {
    if (!engaged) return;
    if (advance(e.deltaY)) e.preventDefault();
  }

  let touchStartY = null;
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!engaged || touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;
    if (advance(dy * (TOUCH_SENSITIVITY / SENSITIVITY))) e.preventDefault();
  }
  function onTouchEnd() {
    touchStartY = null;
  }

  // Re-engage when native scroll brings the page back to the very top —
  // symmetric to the forward hand-off above. The hero is the first section
  // on the page, so "scrollY back at 0" unambiguously means it's back;
  // that's a simpler, more robust signal here than an IntersectionObserver
  // ratio threshold, which .hero's own text content can keep from ever
  // reaching (its rendered height can exceed 100vh on shorter viewports).
  function onNativeScroll() {
    if (!engaged && window.scrollY <= 2) {
      setEngaged(true);
      rawProgress = stationCount - 1;
      displayProgress = stationCount - 1;
    }
  }
  window.addEventListener('scroll', onNativeScroll, { passive: true });

  pinTarget.classList.toggle('is-pinned', engaged); // setEngaged() only syncs on *changes* — apply the initial state explicitly

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  function update(dt) {
    displayProgress += (rawProgress - displayProgress) * (1 - Math.exp(-DAMPING * dt));
    onProgress(displayProgress, engaged);
  }

  function dispose() {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('scroll', onNativeScroll);
    if (settleTimer) clearTimeout(settleTimer);
    pinTarget.classList.remove('is-pinned');
  }

  return { update, dispose };
}
