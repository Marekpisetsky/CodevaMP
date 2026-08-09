// Sizes the particle hero for the device it's actually running on, without
// any GPU-compute assumptions — every tier just changes how much CPU-side
// work particle-physics.js's plain typed-array loop does per frame, and how
// much the renderer/material ask of the GPU (pixel ratio, point size,
// interaction radius). Two stages: a cheap synchronous guess before
// anything renders, then a short real-FPS probe once the scene is actually
// running, which can demote (never promote) the tier once.
export const TIERS = {
  high:    { particleBudget: 55000, pixelRatioCap: 1.5, pointSize: 2.0, noiseComplexity: 1,   interactionRadius: 7.0 },
  medium:  { particleBudget: 27000, pixelRatioCap: 1.5, pointSize: 2.3, noiseComplexity: 1,   interactionRadius: 6.5 },
  low:     { particleBudget: 13000, pixelRatioCap: 1.0, pointSize: 2.7, noiseComplexity: 0.6, interactionRadius: 6.0 },
  veryLow: { particleBudget: 6000,  pixelRatioCap: 1.0, pointSize: 3.2, noiseComplexity: 0,   interactionRadius: 5.0 },
};

const TIER_ORDER = ['high', 'medium', 'low', 'veryLow'];

// The minimum average fps a tier needs to hold onto itself during the probe
// window — fall short and it steps down one tier (see stepDownTier below).
const FPS_FLOOR = { high: 50, medium: 42, low: 26 }; // veryLow has nowhere lower to fall to

function isMobileDevice() {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

// Cheap, synchronous — no rendering has happened yet, so this is a guess to
// start from, confirmed or demoted by measureFps() once the scene is live.
export function guessInitialTier() {
  const mobile = isMobileDevice();
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;

  if (!mobile && cores >= 8) return 'high';
  if (!mobile && cores >= 4) return 'medium';
  if (mobile && cores >= 6 && dpr <= 2.5) return 'medium';
  if (mobile && cores >= 4) return 'low';
  return 'veryLow';
}

export function stepDownTier(tier) {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : tier;
}

export function fpsFloorFor(tier) {
  return FPS_FLOOR[tier] ?? 0;
}

// Resolves once real frames have been sampled for `durationMs`, with the
// achieved average fps. Meant to run concurrently with the scene's own
// render loop (not instead of it) — a plain rAF counter here reports the
// real achieved rate precisely because it competes for the same main-thread
// frame budget as the actual rendering/physics work.
export function measureFps(durationMs = 1500) {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    function tick(now) {
      frames++;
      if (now - start < durationMs) {
        requestAnimationFrame(tick);
      } else {
        resolve((frames * 1000) / Math.max(1, now - start));
      }
    }
    requestAnimationFrame(tick);
  });
}

// Never let devicePixelRatio through uncapped — a tier's own cap, further
// clamped to 1.0 on mobile devices regardless of tier (a demoted-to-veryLow
// desktop already gets 1.0 from its tier; this only matters for a mobile
// device that still tested into medium/high on cores alone).
export function resolvePixelRatio(tier) {
  const raw = window.devicePixelRatio || 1;
  const cap = isMobileDevice() ? Math.min(TIERS[tier].pixelRatioCap, 1.0) : TIERS[tier].pixelRatioCap;
  return Math.min(raw, cap);
}
