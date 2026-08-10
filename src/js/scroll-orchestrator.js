import { reduceMotion } from './utils/motion-prefs.js';

// Coordinates every independent Three.js "stage" on the page (hero, CTA,
// featured video, each Modalidades item once those exist): which one sits
// nearest viewport center ("active") and whether the user has stopped
// scrolling while it's active ("settled"). Each stage only ever hears about
// this through its own `setFocus(active, settled)` (see stage.js) — it eases
// its camera toward a centered framing itself, this module just decides
// who's active and when scrolling has stopped.
const SETTLE_DELAY_MS = 180;

function buildThresholdList(steps = 20) {
  return Array.from({ length: steps + 1 }, (_, i) => i / steps);
}

export function createScrollOrchestrator() {
  const entries = new Map(); // container -> { stage, ratio }
  let activeContainer = null;
  let settleTimer = null;
  let isSettled = false;

  function pickActive() {
    let best = null;
    let bestRatio = 0;
    for (const [container, entry] of entries) {
      if (entry.ratio > bestRatio) {
        bestRatio = entry.ratio;
        best = container;
      }
    }
    return best;
  }

  function applyFocus() {
    for (const [container, entry] of entries) {
      const active = container === activeContainer;
      entry.stage.setFocus?.(active, active && isSettled);
      container.classList.toggle('is-unfocused', activeContainer !== null && !active);
    }
  }

  const observer = new IntersectionObserver((observerEntries) => {
    for (const obsEntry of observerEntries) {
      const entry = entries.get(obsEntry.target);
      if (entry) entry.ratio = obsEntry.intersectionRatio;
    }
    const next = pickActive();
    if (next !== activeContainer) {
      activeContainer = next;
      applyFocus();
    }
  }, {
    threshold: buildThresholdList(),
    rootMargin: '-10% 0px -10% 0px',
  });

  function markSettled(settled) {
    if (isSettled === settled) return;
    isSettled = settled;
    applyFocus();
  }

  function onScroll() {
    markSettled(false);
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => markSettled(true), SETTLE_DELAY_MS);
  }

  if (!reduceMotion) {
    window.addEventListener('scroll', onScroll, { passive: true });
    settleTimer = setTimeout(() => markSettled(true), SETTLE_DELAY_MS);
  } else {
    isSettled = true;
  }

  return {
    register(container, stage) {
      if (!container || !stage) return;
      entries.set(container, { stage, ratio: 0 });
      observer.observe(container);
      if (reduceMotion) stage.setFocus?.(true, true);
    },
    unregister(container) {
      const entry = entries.get(container);
      if (!entry) return;
      observer.unobserve(container);
      entries.delete(container);
      container.classList.remove('is-unfocused');
      if (activeContainer === container) {
        activeContainer = pickActive();
        applyFocus();
      }
    },
  };
}
