import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { createIsland } from './terrain.js';
import { createMinecraftHouse } from './island-props.js';
import { createCameraRig } from './camera-rig.js';
import { createPostProcessing } from './post-processing.js';
import { createOrbitDrag } from '../js/orbit-drag.js';
import { createVirtualScroll } from '../js/virtual-scroll.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// The world-as-a-single-scene pivot (see plan): one continuous 3D
// environment (voxel terrain), one PerspectiveCamera. Per feedback this
// simplified down from 5 scroll-driven stations to just 2 (island, void) —
// the island itself (see ISLAND/createIsland below) is now explored by
// dragging (see createOrbitDrag), not by scrolling between fixed camera
// stops; vertical scroll is reserved for the one real scene change, cutting
// down into the void where the hero is. The particle pipeline (skin-parser
// → particle-physics.js → voxel-model.js) stays exactly as it was — only
// what's built with it changed.
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

// Small and compact on purpose — an earlier, much bigger island (~190 units
// across, several separate elements scattered around it) read as "big and
// shapeless" per feedback, closer to an amorphous landmass than a real
// Bedwars map. One island, one thing on it (the house), no wasted scale.
const ISLAND = { center: { x: 0, z: 0 }, radius: 50 };
const VOID_COLOR = 0x0a0e1c;

// A vertical gradient instead of the old flat single color — "el cielo es
// algo plano" was a direct callout. Same CanvasTexture technique
// terrain.js's createTerrainAtlas already uses, not a new dependency or a
// sky-dome mesh. scene.background accepts a Texture directly (rendered as a
// screen-space backdrop quad), so this is the cheapest way to get a sky
// that isn't a single solid color.
const SKY_HORIZON = '#cdeefb';
const SKY_ZENITH = '#4fa3e0';
function createSkyGradient() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, SKY_ZENITH);
  gradient.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function createWorldScene(container, skinUrl, { onStationChange } = {}) {
  let tier = guessInitialTier();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(resolvePixelRatio(tier));
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const skyTexture = createSkyGradient();
  const voidColor = new THREE.Color(VOID_COLOR);
  scene.background = skyTexture;
  scene.fog = new THREE.FogExp2(SKY_HORIZON, 0.0021);

  // Wide, close FOV — per feedback the old overview camera sat far/high
  // above the island (a drone shot); everything now stays near and roughly
  // eye-level instead (see the `stations` island pose below).
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);

  const ambient = new THREE.AmbientLight(0xaaaab4, 2);
  const key = new THREE.DirectionalLight(0xffe8d8, 1.8);
  key.position.set(-30, 40, 20);
  const rim = new THREE.DirectionalLight(0x8a3028, 1.3);
  rim.position.set(40, 15, -50);
  const fill = new THREE.DirectionalLight(0x5a6a8a, 0.7);
  fill.position.set(0, 25, 60);
  scene.add(ambient, key, rim, fill);

  const terrain = createIsland({
    center: ISLAND.center,
    radius: ISLAND.radius,
    // Just the one anchor now (the island's own center, for the house) —
    // no separate per-station clearings needed anymore.
    clearingRadius: 16,
    anchors: [{ x: ISLAND.center.x, z: ISLAND.center.z, key: 'origin' }],
  });

  // Everything that lives on the island (the ground, the house) goes in one
  // group: it's what the void station hides on the cut (see
  // applyProgressEffects below), and it's what createOrbitDrag spins when
  // the user drags — a single transform for "look around the island".
  const islandGroup = new THREE.Group();
  scene.add(islandGroup);
  islandGroup.add(terrain);

  const islandCenter = new THREE.Vector3(ISLAND.center.x, terrain.standingHeight, ISLAND.center.z);
  const house = createMinecraftHouse({ position: islandCenter });
  islandGroup.add(house);

  // --- Hero (the void station, the closing reveal) — not standing on the
  // island: the camera cuts down into open void below it and the hero is
  // what's waiting down there. Floating, not "standing" — there's no ground
  // this far below the island's own underside.
  //
  // Offset off the island's own x/z center on purpose — sitting directly
  // under it put the hero, the camera, and the island's center all on the
  // same vertical line, so a camera aimed at the hero and a camera aimed
  // "up at the island" were the same direction. Off-axis, the two
  // directions actually separate. ---
  const VOID_DROP = 90;
  const heroVoidCenter = new THREE.Vector3(ISLAND.center.x + 34, terrain.standingHeight - VOID_DROP, ISLAND.center.z - 22);

  async function buildHeroContent(t) {
    return buildHero(skinUrl, t);
  }

  let { points, physics } = await buildHeroContent(tier);
  const heroGroup = new THREE.Group();
  heroGroup.position.copy(heroVoidCenter);
  heroGroup.add(points);
  scene.add(heroGroup);

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

  // Two stations: the island (close, low, horizontal — looking at the house
  // roughly at eye level instead of down from above) and the void (the
  // hero reveal, unchanged from before). Looking around the island itself
  // is drag, not scroll, so it doesn't need its own set of camera stops
  // anymore.
  const stations = [
    orbitStation(islandCenter, 0, 45, 16, 8),                             // island
    orbitStation(heroVoidCenter, 200, 42, -10, FIGURE_HEIGHT * 0.5),      // void — the hero
  ];
  const cameraRig = createCameraRig({ camera, stations });
  let currentProgress = 0;

  // Built before the first setProgress() call below — applyProgressEffects
  // reads it for the void station's flash. Only built when transitions can
  // actually happen: with reduceMotion there's no virtual-scroll, progress
  // never changes, so the composer would just be pure overhead for a
  // passthrough render.
  const postProcessing = reduceMotion ? null : createPostProcessing(renderer, scene, camera);

  // Drag-to-spin the island — see orbit-drag.js. Not built in reduceMotion:
  // the frame loop that would actually apply the rotation never runs there.
  const orbitDrag = reduceMotion ? null : createOrbitDrag({ target: islandGroup, container });

  // With only 2 stations every transition is the same one (island ↔ void),
  // so there's no "is this the void-adjacent transition" check to make
  // anymore — it always is. The cut itself: island/void backgrounds swap
  // instantly (not lerped) at the exact midpoint of the flash, same instant
  // islandGroup's visibility flips — "sube a otra escena" as a real cut,
  // like igloo.inc, instead of a continuous camera move revealing it.
  function applyProgressEffects(progress) {
    const n = stations.length;
    const wrapped = ((progress % n) + n) % n;
    const i0 = Math.floor(wrapped);
    const t = wrapped - i0;

    if (postProcessing) postProcessing.setFlash(Math.sin(t * Math.PI));

    const showIsland = i0 === 0 ? t < 0.5 : t >= 0.5;
    if (showIsland !== islandGroup.visible) {
      islandGroup.visible = showIsland;
      scene.background = showIsland ? skyTexture : voidColor;
      scene.fog.color.set(showIsland ? SKY_HORIZON : VOID_COLOR);
    }
  }

  function setProgress(progress) {
    currentProgress = progress;
    cameraRig.applyProgress(progress);
    applyProgressEffects(progress);
  }
  setProgress(currentProgress);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // Portrait viewports see a much narrower horizontal slice at this fixed
    // vertical FOV, so the dead-center hero/house balloons to fill the
    // width and gets awkwardly cropped — dolly the camera back as aspect
    // narrows to keep its on-screen size roughly stable instead.
    cameraRig.setDistanceScale(aspect < 1 ? Math.min(2.2, 1 / aspect) : 1);
    setProgress(currentProgress);
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
      setProgress(progress);
      if (postProcessing) {
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
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    points.geometry.attributes.position.needsUpdate = true;

    if (orbitDrag) orbitDrag.update(delta);
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
    const staticT = performance.now() / 1000;
    points.material.uniforms.uTime.value = staticT;
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
    if (orbitDrag) orbitDrag.dispose();
    if (postProcessing) postProcessing.dispose();
    if (cursor) cursor.dispose();
    points.geometry.dispose();
    points.material.dispose();
    terrain.userData.dispose();
    house.userData.dispose();
    skyTexture.dispose();
    renderer.dispose();
  }

  return {
    dispose,
    camera,
  };
}
