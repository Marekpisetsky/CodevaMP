import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { createTerrain, createMovingMist } from './terrain.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// Fase 1 of the world-as-a-single-scene pivot (see plan): the hero stands
// in a real 3D environment (voxel terrain + moving mist), viewed with a
// PerspectiveCamera. The hero itself is the already-tuned particle figure
// (skin-parser/particle-physics/voxel-model) — a rigid-block "exploded
// view" treatment (hero-blocks.js, still in the repo) was tried here first
// but didn't read right on the character; that technique is earmarked for
// a Bedwars-themed structure at a later station instead (see plan/tasks).
// Camera choreography (Fase 3) still lands later; this camera is static.
// CTA/destacado/modalidades still use the older stage.js pipeline for now;
// they migrate into this world in Fase 4/5.
async function buildHero(skinUrl, tier) {
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

export async function createWorldScene(container, skinUrl) {
  let tier = guessInitialTier();
  const fogColor = 0x0a0a0c;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(resolvePixelRatio(tier));
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, 0.0032);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);

  const ambient = new THREE.AmbientLight(0xaaaab4, 1.4);
  const key = new THREE.DirectionalLight(0xffe8d8, 1.8);
  key.position.set(-30, 40, 20);
  const rim = new THREE.DirectionalLight(0x8a3028, 1.1);
  rim.position.set(40, 15, -50);
  scene.add(ambient, key, rim);

  const terrain = createTerrain({});
  scene.add(terrain);

  const mist = createMovingMist({ color: fogColor });
  mist.position.set(0, terrain.standingHeight + 6, -44);
  scene.add(mist);
  const mist2 = createMovingMist({ color: fogColor, width: 520 });
  mist2.position.set(70, terrain.standingHeight + 12, -8);
  mist2.rotation.y = Math.PI / 3;
  scene.add(mist2);

  async function buildHeroContent(t) {
    return buildHero(skinUrl, t);
  }

  let { points, physics } = await buildHeroContent(tier);
  const heroGroup = new THREE.Group();
  heroGroup.position.set(0, terrain.standingHeight, 0);
  heroGroup.add(points);
  scene.add(heroGroup);

  // Static for Fase 1 — elevated, pulled-back angle so terrain/mist read
  // clearly behind the figure. Camera choreography lands in Fase 3.
  camera.position.set(0, terrain.standingHeight + FIGURE_HEIGHT * 0.6, 46);
  camera.lookAt(0, terrain.standingHeight + FIGURE_HEIGHT * 0.5, 0);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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

    points.rotation.y += delta * 0.2;
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;
    mist.material.uniforms.uTime.value = t;
    mist2.material.uniforms.uTime.value = t;

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

  async function calibrateOnce() {
    if (downgradeChecked || reduceMotion) return;
    downgradeChecked = true;
    const fps = await measureFps(1500);
    if (fps >= fpsFloorFor(tier)) return;

    const nextTier = stepDownTier(tier);
    if (nextTier === tier) return;
    tier = nextTier;

    const rebuilt = await buildHeroContent(tier);
    heroGroup.remove(points);
    points.geometry.dispose();
    points.material.dispose();
    if (cursor) cursor.dispose();

    points = rebuilt.points;
    physics = rebuilt.physics;
    heroGroup.add(points);
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
    terrain.geometry.dispose();
    terrain.material.dispose();
    mist.geometry.dispose();
    mist.material.dispose();
    mist2.geometry.dispose();
    mist2.material.dispose();
    renderer.dispose();
  }

  return { dispose, camera };
}
