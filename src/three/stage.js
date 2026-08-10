import * as THREE from 'three';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// Generic renderer/camera/loop/tier-calibration bootstrap, extracted from
// what used to be hero-only code in scene.js. Every section that wants its
// own isolated Three.js "environment" (hero, CTA, featured video, each
// Modalidades item) gets one of these — independent canvas, independent
// render loop, independent device-tier calibration — coordinated from the
// outside only via `setFocus()` (driven by scroll-orchestrator.js).
//
// `buildContent(tier)` must resolve to `{ points, physics, extraObjects? }`:
// `points` a THREE.Points added to the scene, `physics.update(dt, cursor, t)`
// + `physics.positions` (mutable Float32Array driving `points.geometry`),
// same shape `createParticlePhysics()` already returns — this is exactly
// what buildParticleSystem() in scene.js produces today, so the hero slots
// in unchanged. `extraObjects` is an optional array of additional THREE
// objects (e.g. the hero's ground ring) added/removed alongside `points`.
export async function createStage({
  container,
  buildContent,
  cameraConfig, // { centerY, halfHeight, idleZoom = 1, settledZoom = 1, zoomDamping = 4 }
  useCursor = true,
}) {
  let tier = guessInitialTier();
  const { centerY, halfHeight, idleZoom = 1, settledZoom = 1, zoomDamping = 4 } = cameraConfig;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(resolvePixelRatio(tier));
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  camera.position.set(0, centerY, 90);
  camera.lookAt(0, centerY, 0);

  let currentZoom = idleZoom;

  function applyFrustum(width, height) {
    const halfH = halfHeight * currentZoom;
    const halfW = halfH * (width / height);
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  let { points, physics, extraObjects = [] } = await buildContent(tier);
  scene.add(points);
  for (const obj of extraObjects) scene.add(obj);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    applyFrustum(width, height);
  }
  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let cursor = useCursor && hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
  let raf = null;
  let lastTime = performance.now();
  let downgradeChecked = false;

  // Driven by scroll-orchestrator.js: `active` = this section is the one
  // nearest viewport center, `settled` = the user stopped scrolling while
  // it was active. Camera zoom damps toward settledZoom/idleZoom instead of
  // snapping, so the "encuadra al centro" framing eases in smoothly.
  let focusSettled = false;
  function setFocus(active, settled) {
    focusSettled = active && settled;
  }

  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    points.rotation.y += delta * 0.35;
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    points.geometry.attributes.position.needsUpdate = true;

    const targetZoom = focusSettled ? settledZoom : idleZoom;
    if (Math.abs(currentZoom - targetZoom) > 0.0001) {
      currentZoom += (targetZoom - currentZoom) * (1 - Math.exp(-zoomDamping * delta));
      applyFrustum(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function ensureLoop() {
    if (!raf && !document.hidden) {
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  // One-shot: confirm the static tier guess against real achieved fps a
  // couple seconds in, and step down (never back up) if it's not holding —
  // rebuilds the content in place at the lower budget/settings.
  async function calibrateOnce() {
    if (downgradeChecked || reduceMotion) return;
    downgradeChecked = true;
    const fps = await measureFps(1500);
    if (fps >= fpsFloorFor(tier)) return;

    const nextTier = stepDownTier(tier);
    if (nextTier === tier) return; // already at the floor (veryLow)
    tier = nextTier;

    const rebuilt = await buildContent(tier);
    scene.remove(points);
    for (const obj of extraObjects) scene.remove(obj);
    points.geometry.dispose();
    points.material.dispose();
    if (cursor) cursor.dispose();

    points = rebuilt.points;
    physics = rebuilt.physics;
    extraObjects = rebuilt.extraObjects || [];
    scene.add(points);
    for (const obj of extraObjects) scene.add(obj);
    cursor = useCursor && hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
    renderer.setPixelRatio(resolvePixelRatio(tier));
  }

  if (reduceMotion) {
    points.material.uniforms.uTime.value = performance.now() / 1000;
    renderer.render(scene, camera);
  } else {
    ensureLoop();
    calibrateOnce();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else ensureLoop();
    });
  }

  function dispose() {
    stopLoop();
    resizeObserver.disconnect();
    if (cursor) cursor.dispose();
    points.geometry.dispose();
    points.material.dispose();
    for (const obj of extraObjects) {
      obj.geometry?.dispose();
      obj.material?.dispose();
    }
    renderer.dispose();
  }

  // A getter, not a snapshot: `points` gets swapped wholesale on a
  // tier-downgrade rebuild (calibrateOnce), so callers holding onto the
  // object directly (e.g. hud-label.js anchoring to it) would go stale.
  return { dispose, setFocus, camera, getContentObject: () => points };
}
