import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT, FIGURE_CENTER_Y } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createCursorTracker } from './cursor-interaction.js';
import { createParticlePhysics } from './particle-physics.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

function createGroundRing() {
  const geometry = new THREE.RingGeometry(9, 12, 6, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x7a140e,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

async function buildParticleSystem(skinUrl, tier) {
  const config = TIERS[tier];
  const skinData = await parseSkin(skinUrl, { targetCount: config.particleBudget });
  if (skinData.count === 0) throw new Error('empty skin: no opaque pixels parsed');

  const physics = createParticlePhysics({
    basePositions: skinData.positions,
    count: skinData.count,
    interactionRadius: config.interactionRadius,
    noiseComplexity: config.noiseComplexity,
  });
  const points = createVoxelModel({
    positions: physics.positions,
    colors: skinData.colors,
    normals: skinData.normals,
    seeds: skinData.seeds,
    pointSize: config.pointSize,
    pixelRatio: resolvePixelRatio(tier),
  });

  return { points, physics };
}

export async function createHeroScene(container, skinUrl) {
  let tier = guessInitialTier();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(resolvePixelRatio(tier)); // never devicePixelRatio uncapped — see device-quality.js
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  camera.position.set(0, FIGURE_CENTER_Y, 90);
  camera.lookAt(0, FIGURE_CENTER_Y, 0);

  function applyFrustum(width, height) {
    const halfH = FIGURE_HEIGHT * 0.66;
    const halfW = halfH * (width / height);
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  let { points, physics } = await buildParticleSystem(skinUrl, tier);
  scene.add(points);

  const ring = createGroundRing();
  scene.add(ring);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    applyFrustum(width, height);
  }
  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let cursor = hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
  let raf = null;
  let lastTime = performance.now();
  let downgradeChecked = false;

  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    points.rotation.y += delta * 0.35;
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    points.geometry.attributes.position.needsUpdate = true;

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
  // rebuilds the particle system in place at the lower budget/settings.
  async function calibrateOnce() {
    if (downgradeChecked || reduceMotion) return;
    downgradeChecked = true;
    const fps = await measureFps(1500);
    if (fps >= fpsFloorFor(tier)) return;

    const nextTier = stepDownTier(tier);
    if (nextTier === tier) return; // already at the floor (veryLow)
    tier = nextTier;

    const rebuilt = await buildParticleSystem(skinUrl, tier);
    scene.remove(points);
    points.geometry.dispose();
    points.material.dispose();
    if (cursor) cursor.dispose();

    points = rebuilt.points;
    physics = rebuilt.physics;
    scene.add(points);
    cursor = hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
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
    ring.geometry.dispose();
    ring.material.dispose();
    renderer.dispose();
  }

  return { dispose };
}
