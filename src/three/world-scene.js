import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { createTerrain, createMovingMist, createCrystalCluster } from './terrain.js';
import { createCameraRig } from './camera-rig.js';
import { createPostProcessing } from './post-processing.js';
import { createHudLabel } from './hud-label.js';
import { buildModalidadContent } from './modalidad-object.js';
import { buildBedwarsContent } from './bedwars-object.js';
import { PORTFOLIO_ITEMS } from './portfolio-items.js';
import { createVirtualScroll } from '../js/virtual-scroll.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// The world-as-a-single-scene pivot (see plan): one continuous 3D
// environment (voxel terrain + moving mist), one PerspectiveCamera orbiting
// between 4 stations (hero/destacado/modalidades/cta) driven by
// virtual-scroll.js's scroll-jacking, instead of 4 independent per-section
// canvases. Every object in the world — hero, Modalidades item, the
// Bedwars bed at the cta station — is built from the same particle
// pipeline (skin-parser or mesh-sampler.js → particle-physics.js →
// voxel-model.js). A rigid-block "exploded view" treatment
// (hero-blocks.js, still in the repo but unused) was tried on the hero
// character first and didn't read right there; per feedback everything
// stays in this one particle language instead. Every station is now pure
// 3D world — no DOM overlay content anywhere, per feedback that any
// element in front of the world should be deleted, not just repositioned.
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

// Each station claims its own patch of the shared ground, its own palette,
// and its own fog tint — instead of the camera just changing angle on one
// uniform surface. Arriving at a station is meant to read as arriving
// somewhere new, the way igloo.inc cuts from its igloo to icebergs to its
// pointillist-figure scene and back around. Order matches `stations` below
// (index i's zone is station i's zone) so fog/terrain lookups can share
// the same index.
// Every zone got a brightness/saturation pass — the previous colorLow/
// fogColor values were dark enough (near-black) that the flat ground right
// under a station's own object and the "sky" (scene.background, which just
// mirrors the current fog color — see applyFogForProgress below, there's no
// separate sky dome) both read as void instead of a colored place. Keeping
// each station's identity but lifting it out of near-black: destacado in
// particular moves to an actual bright sky-blue per feedback that "cool"
// doesn't have to mean dark to look good.
const STATION_ZONES = [
  {
    key: 'hero', x: 0, z: 0, radius: 38,
    colorLow: 0x3a2024, colorMid: 0x6e2019, colorHigh: 0xf2483a,
    fogColor: 0x241014,
  },
  {
    // Far to the +x side, roughly level with hero in z — checked against
    // every other station's camera forward direction so the icebergs stay
    // out of frame until progress actually carries the camera here (an
    // earlier placement along hero's own -z line of sight, then one
    // further +z past modalidades/cta, both leaked into other stations'
    // shots since those cameras end up looking back roughly toward -z
    // regardless of which station they belong to).
    key: 'destacado', x: 120, z: 0, radius: 30,
    colorLow: 0x3d6180, colorMid: 0x5e93b5, colorHigh: 0xdff4fc,
    fogColor: 0x8fd4f2,
  },
  {
    key: 'modalidades', x: 60, z: 42, radius: 30,
    colorLow: 0x3d2a5c, colorMid: 0x6b45a0, colorHigh: 0xc796fa,
    fogColor: 0x3a2560,
  },
  {
    key: 'cta', x: -58, z: 52, radius: 30,
    colorLow: 0x40201c, colorMid: 0x82241c, colorHigh: 0xff5c44,
    fogColor: 0x381814,
  },
];

export async function createWorldScene(container, skinUrl, { onStationChange } = {}) {
  let tier = guessInitialTier();
  const fogColor = STATION_ZONES[0].fogColor;

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

  const terrain = createTerrain({ zones: STATION_ZONES });
  scene.add(terrain);

  const mist = createMovingMist({ color: fogColor });
  mist.position.set(0, terrain.standingHeight + 6, -44);
  scene.add(mist);
  const mist2 = createMovingMist({ color: fogColor, width: 520 });
  mist2.position.set(70, terrain.standingHeight + 12, -8);
  mist2.rotation.y = Math.PI / 3;
  scene.add(mist2);

  const [heroZone, destacadoZone, modalidadZone, bedZone] = STATION_ZONES;

  // --- Destacado (station 1) — its own spot on the terrain, not the
  // hero's spot viewed from further back. The video content itself is
  // still DOM (world-panels.js cross-fades it in), but the icebergs give
  // the station its own silhouette instead of empty ground underneath it. ---
  const destacadoCenter = new THREE.Vector3(destacadoZone.x, terrain.standingHeight, destacadoZone.z);
  const icebergs = createCrystalCluster({
    center: destacadoCenter,
    colorLow: destacadoZone.colorLow,
    colorHigh: destacadoZone.colorHigh,
  });
  scene.add(icebergs);

  // --- Hero (station 0) ---
  async function buildHeroContent(t) {
    return buildHero(skinUrl, t);
  }

  let { points, physics } = await buildHeroContent(tier);
  const heroGroup = new THREE.Group();
  heroGroup.position.set(heroZone.x, terrain.standingHeight, heroZone.z);
  heroGroup.add(points);
  scene.add(heroGroup);

  // --- Modalidades object (station 2) — its own spot on the terrain, not
  // stacked on top of the hero. ---
  let modalidadIndex = 0;
  async function buildModalidadItemContent(t) {
    return buildModalidadContent(PORTFOLIO_ITEMS[modalidadIndex], modalidadIndex, t);
  }

  let { points: modalidadPoints, physics: modalidadPhysics } = await buildModalidadItemContent(tier);
  const modalidadCenter = new THREE.Vector3(modalidadZone.x, terrain.standingHeight + 9, modalidadZone.z);
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

  // --- Bedwars bed (station 3, replaces "orbit the hero again") — the
  // structure the plan's rigid-block idea was meant for, kept in the same
  // particle language as everything else instead. A small reprise of the
  // hero figure stands beside it, "defending" it, tying the CTA's closing
  // beat back to the actual game the channel is about. ---
  const bedCenter = new THREE.Vector3(bedZone.x, terrain.standingHeight, bedZone.z);

  const { points: bedPoints, physics: bedPhysics } = await buildBedwarsContent(tier);
  const bedGroup = new THREE.Group();
  bedGroup.position.copy(bedCenter);
  bedGroup.add(bedPoints);
  scene.add(bedGroup);

  const { points: camperPoints, physics: camperPhysics } = await buildHero(skinUrl, tier);
  const camperGroup = new THREE.Group();
  // Offset diagonally, not just along one axis — purely-sideways placement
  // put it directly in front of the bed from the station's own camera
  // angle, merging the two into one blob instead of reading as two things.
  camperGroup.position.set(bedCenter.x + 11, terrain.standingHeight, bedCenter.z + 9);
  camperGroup.scale.setScalar(0.6);
  camperGroup.rotation.y = -Math.PI / 3;
  camperGroup.add(camperPoints);
  scene.add(camperGroup);

  const bedLabel = createHudLabel({
    container,
    camera,
    getObject: () => bedGroup,
    anchor: new THREE.Vector3(0, 5, 0),
    title: 'CODEVAMP_04',
    sub: 'DEFEND.BED',
  });

  // Four stations, one per section of the site (hero/destacado/modalidades/
  // cta), each orbiting its own zone's center (STATION_ZONES above) — a
  // real change of place each time progress crosses a station, not just a
  // wider-angle look at the same spot the hero stands on.
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

  const heroCenter = new THREE.Vector3(heroZone.x, terrain.standingHeight, heroZone.z);

  const stations = [
    orbitStation(heroCenter, 0, 46, FIGURE_HEIGHT * 0.6, FIGURE_HEIGHT * 0.5),  // hero
    orbitStation(destacadoCenter, 15, 44, 22, 10),                             // destacado — the icebergs
    orbitStation(modalidadCenter, 30, 42, 15, 6),                               // modalidades — its own object
    orbitStation(bedCenter, 25, 52, 19, 4),                                     // cta — the Bedwars bed + camper
  ];
  const cameraRig = createCameraRig({ camera, stations });
  let currentProgress = 0;

  const _fogA = new THREE.Color();
  const _fogB = new THREE.Color();
  function applyFogForProgress(progress) {
    const n = STATION_ZONES.length;
    const wrapped = ((progress % n) + n) % n;
    const i0 = Math.floor(wrapped);
    const i1 = (i0 + 1) % n;
    const t = wrapped - i0;
    _fogA.set(STATION_ZONES[i0].fogColor);
    _fogB.set(STATION_ZONES[i1].fogColor);
    scene.fog.color.copy(_fogA).lerp(_fogB, t);
    scene.background.copy(scene.fog.color);
  }

  function setProgress(progress) {
    currentProgress = progress;
    cameraRig.applyProgress(progress);
    applyFogForProgress(progress);
  }
  setProgress(currentProgress);

  // Only built when transitions can actually happen — with reduceMotion
  // there's no virtual-scroll, progress never changes, so the composer
  // would just be pure overhead for a passthrough render.
  const postProcessing = reduceMotion ? null : createPostProcessing(renderer, scene, camera);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    // Portrait viewports see a much narrower horizontal slice at this fixed
    // vertical FOV, so the dead-center hero/bed balloons to fill the width
    // and gets awkwardly cropped — dolly the camera back as aspect narrows
    // to keep its on-screen size roughly stable instead.
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
    bedGroup.rotation.y += delta * 0.08;
    camperPoints.rotation.y += delta * 0.3;
    const t = now / 1000;
    points.material.uniforms.uTime.value = t;
    modalidadPoints.material.uniforms.uTime.value = t;
    bedPoints.material.uniforms.uTime.value = t;
    camperPoints.material.uniforms.uTime.value = t;
    mist.material.uniforms.uTime.value = t;
    mist2.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    points.geometry.attributes.position.needsUpdate = true;

    modalidadPhysics.update(delta, null, t);
    modalidadPoints.geometry.attributes.position.needsUpdate = true;

    bedPhysics.update(delta, null, t);
    bedPoints.geometry.attributes.position.needsUpdate = true;

    camperPhysics.update(delta, null, t);
    camperPoints.geometry.attributes.position.needsUpdate = true;

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
    modalidadPoints.material.uniforms.uTime.value = staticT;
    bedPoints.material.uniforms.uTime.value = staticT;
    camperPoints.material.uniforms.uTime.value = staticT;
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
    bedPoints.geometry.dispose();
    bedPoints.material.dispose();
    bedLabel.dispose();
    camperPoints.geometry.dispose();
    camperPoints.material.dispose();
    terrain.userData.dispose();
    icebergs.userData.dispose();
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
