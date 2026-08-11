// Scroll-jacking for the hero's cinematic camera: while "engaged", wheel/
// touch input drives a virtual progress value instead of scrolling the
// real page — the only way to get a non-linear camera path (pull back
// before advancing) and an auto-completing snap when the user lets go
// mid-transition. Forward past the last station hands control back to
// native scroll so the rest of the page (destacado, modalidades, cta)
// scrolls normally beneath the pinned hero; backward past the first
// station wraps around to the last one instead of dead-ending — "como si
// nunca se terminara de dar vueltas" — camera-rig.js's progress
// interpolation is modulo-based specifically so this is meaningful.
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
  let engaged = true;
  let settled = false;
  let settleTimer = null;

  function setEngaged(next) {
    if (engaged === next) return;
    engaged = next;
    pinTarget.classList.toggle('is-pinned', engaged);
  }

  function scheduleSettle() {
    settled = false;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      rawProgress = Math.round(rawProgress);
      settled = true;
    }, SETTLE_DELAY_MS);
  }

  function advance(deltaY) {
    const forward = deltaY > 0;
    if (forward && rawProgress >= stationCount - 1 - 0.001) {
      setEngaged(false);
      return false; // not consumed — let this scroll reach the real page
    }
    rawProgress += deltaY * SENSITIVITY;
    if (rawProgress < 0) rawProgress += stationCount; // loop backward into the last station
    if (rawProgress > stationCount - 1) rawProgress = stationCount - 1;
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
      settled = true;
    }
  }
  window.addEventListener('scroll', onNativeScroll, { passive: true });

  pinTarget.classList.toggle('is-pinned', engaged); // setEngaged() only syncs on *changes* — apply the initial state explicitly

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  function update(dt) {
    const damping = settled ? DAMPING_SETTLE : DAMPING_ACTIVE;
    displayProgress += (rawProgress - displayProgress) * (1 - Math.exp(-damping * dt));
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
