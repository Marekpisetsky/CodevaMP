import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { createTerrain, createMovingMist } from './terrain.js';
import { createCameraRig } from './camera-rig.js';
import { createPostProcessing } from './post-processing.js';
import { createHudLabel } from './hud-label.js';
import { buildModalidadContent } from './modalidad-object.js';
import { PORTFOLIO_ITEMS } from './portfolio-items.js';
import { createVirtualScroll } from '../js/virtual-scroll.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// The world-as-a-single-scene pivot (see plan): one continuous 3D
// environment (voxel terrain + moving mist), one PerspectiveCamera orbiting
// between 4 stations (hero/destacado/modalidades/cta) driven by
// virtual-scroll.js's scroll-jacking, instead of 4 independent per-section
// canvases. The hero itself is the already-tuned particle figure
// (skin-parser/particle-physics/voxel-model) — a rigid-block "exploded
// view" treatment (hero-blocks.js, still in the repo) was tried here first
// but didn't read right on the character; that technique is earmarked for
// a Bedwars-themed structure at a later station instead (see plan/tasks).
// Modalidades' own object now lives in this same world too (Fase 5,
// modalidad-object.js) — destacado/cta still don't have bespoke 3D scenery
// of their own, world-panels.js cross-fades their real DOM content instead.
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

export async function createWorldScene(container, skinUrl, { onStationChange } = {}) {
  let tier = guessInitialTier();
  const fogColor = 0x0a0a0c;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(resolvePixelRatio(tier));
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, 0.0021);

  // Wider than a "look at one figure" framing on purpose — on a wide
  // viewport the old 42° left huge dead-black margins on either side (the
  // terrain was technically there, just too dim/far to read), which
  // defeated the whole point of the hero being full-viewport. This plus
  // the lighting bump below is what makes it actually read as a wallpaper
  // world instead of one figure floating in black.
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);

  const ambient = new THREE.AmbientLight(0xaaaab4, 2);
  const key = new THREE.DirectionalLight(0xffe8d8, 1.8);
  key.position.set(-30, 40, 20);
  const rim = new THREE.DirectionalLight(0x8a3028, 1.3);
  rim.position.set(40, 15, -50);
  const fill = new THREE.DirectionalLight(0x5a6a8a, 0.7);
  fill.position.set(0, 25, 60);
  scene.add(ambient, key, rim, fill);

  const terrain = createTerrain({});
  scene.add(terrain);

  const mist = createMovingMist({ color: fogColor });
  mist.position.set(0, terrain.standingHeight + 6, -44);
  scene.add(mist);
  const mist2 = createMovingMist({ color: fogColor, width: 520 });
  mist2.position.set(70, terrain.standingHeight + 12, -8);
  mist2.rotation.y = Math.PI / 3;
  scene.add(mist2);

  // --- Hero (station 0) ---
  async function buildHeroContent(t) {
    return buildHero(skinUrl, t);
  }

  let { points, physics } = await buildHeroContent(tier);
  const heroGroup = new THREE.Group();
  heroGroup.position.set(0, terrain.standingHeight, 0);
  heroGroup.add(points);
  scene.add(heroGroup);

  // --- Modalidades object (station 2) — its own spot on the terrain, not
  // stacked on top of the hero. ---
  let modalidadIndex = 0;
  async function buildModalidadItemContent(t) {
    return buildModalidadContent(PORTFOLIO_ITEMS[modalidadIndex], modalidadIndex, t);
  }

  let { points: modalidadPoints, physics: modalidadPhysics } = await buildModalidadItemContent(tier);
  const modalidadCenter = new THREE.Vector3(60, terrain.standingHeight + 9, 42);
  const modalidadGroup = new THREE.Group();
  modalidadGroup.position.copy(modalidadCenter);
  modalidadGroup.add(modalidadPoints);
  scene.add(modalidadGroup);

  const modalidadLabel = createHudLabel({
    container,
    camera,
    getObject: () => modalidadGroup,
    anchor: new THREE.Vector3(0, 7, 0),
    title: PORTFOLIO_ITEMS[0].tag,
    sub: PORTFOLIO_ITEMS[0].stat,
  });

  async function setModalidadItem(index) {
    modalidadIndex = ((index % PORTFOLIO_ITEMS.length) + PORTFOLIO_ITEMS.length) % PORTFOLIO_ITEMS.length;
    const item = PORTFOLIO_ITEMS[modalidadIndex];
    const rebuilt = await buildModalidadItemContent(tier);
    modalidadGroup.remove(modalidadPoints);
    modalidadPoints.geometry.dispose();
    modalidadPoints.material.dispose();

    modalidadPoints = rebuilt.points;
    modalidadPhysics = rebuilt.physics;
    modalidadGroup.add(modalidadPoints);
    modalidadLabel.setText(item.tag, item.stat);
    return modalidadIndex;
  }

  // Four stations, one per section of the site (hero/destacado/modalidades/
  // cta) — the camera orbits around a `center` point instead of jumping
  // between unrelated scenes, so each arrival still reads as part of one
  // continuous place. destacado/cta orbit the hero's own spot (no bespoke
  // object there yet, see file header); modalidades orbits its own object.
  function orbitStation(center, angleDeg, distance, heightAboveCenter, lookAtOffsetY = 0) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      position: new THREE.Vector3(
        center.x + Math.sin(rad) * distance,
        center.y + heightAboveCenter,
        center.z + Math.cos(rad) * distance,
      ),
      lookAt: new THREE.Vector3(center.x, center.y + lookAtOffsetY, center.z),
    };
  }

  const heroCenter = new THREE.Vector3(0, terrain.standingHeight, 0);

  const stations = [
    orbitStation(heroCenter, 0, 46, FIGURE_HEIGHT * 0.6, FIGURE_HEIGHT * 0.5),        // hero
    orbitStation(heroCenter, 55, 85, FIGURE_HEIGHT * 1.0, FIGURE_HEIGHT * 0.4),        // destacado
    orbitStation(modalidadCenter, 30, 42, 15, 6),                                      // modalidades — its own object
    orbitStation(heroCenter, 220, 62, FIGURE_HEIGHT * 0.7, FIGURE_HEIGHT * 0.45),      // cta — closer again, "coming home"
  ];
  const cameraRig = createCameraRig({ camera, stations });
  cameraRig.applyProgress(0);

  // Only built when transitions can actually happen — with reduceMotion
  // there's no virtual-scroll, progress never changes, so the composer
  // would just be pure overhead for a passthrough render.
  const postProcessing = reduceMotion ? null : createPostProcessing(renderer, scene, camera);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (postProcessing) postProcessing.setSize(width, height);
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let cursor = hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
  let raf = null;
  let lastTime = performance.now();
  let downgradeChecked = false;

  // Scroll-jacking is an invasive technique — it's only ever wired up when
  // reduceMotion is false. With reduceMotion, none of this exists and the
  // page behaves as a completely normal scrolling document; that's the real
  // accessibility fallback, not a try/catch around the jacking itself.
  const virtualScroll = reduceMotion ? null : createVirtualScroll({
    pinTarget: container.parentElement, // .hero-portrait
    stationCount: stations.length,
    onProgress: (progress, engaged) => {
      cameraRig.applyProgress(progress);
      if (postProcessing) {
        // 0 exactly on a station, peaking halfway through a transition —
        // the "solo durante una transición" cue from the plan, with no
        // separate velocity tracking needed.
        const distFromStation = Math.abs(progress - Math.round(progress));
        postProcessing.setIntensity(Math.min(1, distFromStation * 2.2));
      }
      if (onStationChange) onStationChange(progress, engaged);
    },
  });

  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    points.rotation.y += delta * 0.2;
    modalidadGroup.rotation.y += delta * 0.25;
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;
    modalidadPoints.material.uniforms.uTime.value = t;
    mist.material.uniforms.uTime.value = t;
    mist2.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    points.geometry.attributes.position.needsUpdate = true;

    modalidadPhysics.update(delta, null, t);
    modalidadPoints.geometry.attributes.position.needsUpdate = true;

    if (virtualScroll) virtualScroll.update(delta);

    if (postProcessing) postProcessing.render();
    else renderer.render(scene, camera);
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
    modalidadPoints.material.uniforms.uTime.value = performance.now() / 1000;
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
    if (virtualScroll) virtualScroll.dispose();
    if (postProcessing) postProcessing.dispose();
    if (cursor) cursor.dispose();
    points.geometry.dispose();
    points.material.dispose();
    modalidadPoints.geometry.dispose();
    modalidadPoints.material.dispose();
    modalidadLabel.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
    mist.geometry.dispose();
    mist.material.dispose();
    mist2.geometry.dispose();
    mist2.material.dispose();
    renderer.dispose();
  }

  return {
    dispose,
    camera,
    setModalidadItem,
    getModalidadIndex: () => modalidadIndex,
  };
}
