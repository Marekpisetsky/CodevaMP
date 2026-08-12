import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { createCursorTracker } from './cursor-interaction.js';
import { TIERS, guessInitialTier, stepDownTier, fpsFloorFor, measureFps, resolvePixelRatio } from './device-quality.js';
import { createIsland, createBackgroundIsland } from './terrain.js';
import { createGenerator, createShopStall, createWoolCluster } from './island-props.js';
import { createCameraRig } from './camera-rig.js';
import { createPostProcessing } from './post-processing.js';
import { createHudLabel } from './hud-label.js';
import { buildModalidadContent } from './modalidad-object.js';
import { buildBedwarsContent } from './bedwars-object.js';
import { PORTFOLIO_ITEMS } from './portfolio-items.js';
import { createVirtualScroll } from '../js/virtual-scroll.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// The world-as-a-single-scene pivot (see plan): one continuous 3D
// environment (voxel terrain), one PerspectiveCamera orbiting
// between 5 stations (overview/destacado/modalidades/cta/hero) driven by
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

// One real island (see terrain.js's createIsland) instead of 4 separately
// tinted zones on an infinite grid — every station now shares the same
// ground, and a station is meant to read as a different place because of
// what's actually standing there (a resource generator, the Bedwars bed,
// the Modalidades carousel item), not because the ground itself changes
// color under each camera.
//
// Anchors sit 120° apart around the island center so each camera looks back
// in at its own subject with the rest of the island behind it, instead of
// three cameras all favoring the same side. `angle` is reused for both the
// anchor's own placement and its camera's orbitStation angle below, so the
// two can never drift out of sync.
const ISLAND = { center: { x: 0, z: 0 }, radius: 95 };
// 48 put every anchor's object/label in view from every other station's
// camera at once (confirmed by screenshot — modalidades' label was legible
// from the hero station) — cute for "it's all one place" but reads as
// clutter rather than a series of distinct beats. Wider spacing keeps that
// same-island cohesion while giving each station room to actually be the
// only thing in frame.
const ANCHOR_RADIUS = 65;
function anchorAt(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * ANCHOR_RADIUS, z: Math.cos(rad) * ANCHOR_RADIUS, angle: angleDeg };
}
const ELEMENTS = {
  // Not a station anchor anymore (the hero moved into the void below the
  // island — see heroVoidCenter) but still kept in `anchors` so the island's
  // true center stays a flat, level plateau — every other anchor's Y
  // baseline is `terrain.standingHeight`, which is measured at this exact
  // point, so it has to stay flat even with nothing standing on it.
  origin: { x: 0, z: 0, angle: 0 },
  destacado: anchorAt(90),
  modalidades: anchorAt(210),
  cta: anchorAt(330),
};
// The bright, luminous sky-blue from earlier feedback for every station
// still on the island, and a dark "void" palette for the final station,
// where the camera drops below the island to reveal the hero — see
// STATION_SKY below.
const SKY_COLOR = 0x8fd4f2;
const VOID_COLOR = 0x0a0e1c;

// Distant, low-detail islands scattered around the main one — the "other
// islands visible in the distance, like in Bedwars" beat. Angles deliberately
// don't line up with ELEMENTS' 90/210/330 so a background island never sits
// directly behind a station's own subject.
//
// Every station's camera sits fairly low and close (15-24 units above the
// island, 42-52 away, looking in at its own nearby subject) — a background
// island anywhere near that same height range just disappears behind the
// main island's own much-closer bulk, confirmed by an earlier pass that put
// them at camera height and got zero of them actually visible in any of the
// 4 stations' shots. Biasing height well above typical camera height (most
// entries 45-90) is what actually gets them poking above the main island's
// silhouette into open sky; a couple stay low/negative for the future
// void-look-up station, where "below" is the point.
const BACKGROUND_ISLANDS = [
  { angle: 30, distance: 150, height: 55, radius: 20, seed: 11 },
  { angle: 150, distance: 190, height: 78, radius: 26, seed: 27 },
  { angle: 270, distance: 160, height: 45, radius: 18, seed: 43 },
  { angle: 60, distance: 220, height: 90, radius: 22, seed: 59 },
  { angle: 300, distance: 200, height: 62, radius: 16, seed: 71 },
  { angle: 200, distance: 180, height: -30, radius: 24, seed: 83 },
  { angle: 330, distance: 240, height: -55, radius: 30, seed: 95 },
];

export async function createWorldScene(container, skinUrl, { onStationChange } = {}) {
  let tier = guessInitialTier();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(resolvePixelRatio(tier));
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.FogExp2(SKY_COLOR, 0.0021);

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

  const terrain = createIsland({
    center: ISLAND.center,
    radius: ISLAND.radius,
    // Smaller than the old single-hero-clearing default (42 world units) —
    // with 4 anchors now sharing one bounded island, the old radius would
    // flatten almost the entire thing. A tighter flat spot per anchor
    // leaves real noise-driven terrain visible between them.
    clearingRadius: 18,
    anchors: Object.entries(ELEMENTS).map(([key, a]) => ({ ...a, key })),
  });

  // Everything that lives on the island (the ground itself, the distant
  // islands, every real element) goes in one group so the void station can
  // hide the whole cluster in one call instead of tracking each piece —
  // see applyProgressEffects below, the "cut to another scene" beat.
  const islandGroup = new THREE.Group();
  scene.add(islandGroup);
  islandGroup.add(terrain);

  const backgroundIslands = BACKGROUND_ISLANDS.map((b) => {
    const rad = (b.angle * Math.PI) / 180;
    const mesh = createBackgroundIsland({
      center: new THREE.Vector3(
        Math.sin(rad) * b.distance,
        terrain.standingHeight + b.height,
        Math.cos(rad) * b.distance,
      ),
      radius: b.radius,
      seed: b.seed,
    });
    islandGroup.add(mesh);
    return mesh;
  });

  // --- Destacado (station 1) — its own spot on the island, not the hero's
  // spot viewed from further back. The video content itself is still DOM
  // (world-panels.js cross-fades it in); a resource generator gives the
  // station its own silhouette instead of empty ground underneath it, and
  // reads as "featured" the way a generator is the natural focal point of
  // any real Bedwars island. ---
  const destacadoCenter = new THREE.Vector3(ELEMENTS.destacado.x, terrain.anchorHeights.destacado, ELEMENTS.destacado.z);
  const generator = createGenerator({ position: destacadoCenter });
  islandGroup.add(generator);

  // --- Hero (station 4, the closing reveal) — not standing on the island
  // anymore: after the scroll passes every real element up top, the camera
  // drops below the island into open void and the hero is what's waiting
  // down there. Floating, not "standing" — there's no ground this far below
  // the island's own underside, so it doesn't need terrain.standingHeight
  // the way every on-island object does.
  //
  // Offset off the island's own x/z center on purpose — sitting directly
  // under it put the hero, the camera, and the island's center all on the
  // same vertical line, so a camera aimed at the hero and a camera aimed
  // "up at the island" were the same direction; the station read as looking
  // at the island with the hero incidentally in the way, not looking at the
  // hero. Off-axis, the two directions actually separate. ---
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

  // --- Modalidades object (station 2) — its own spot on the island, not
  // stacked on top of the hero. ---
  let modalidadIndex = 0;
  async function buildModalidadItemContent(t) {
    return buildModalidadContent(PORTFOLIO_ITEMS[modalidadIndex], modalidadIndex, t);
  }

  let { points: modalidadPoints, physics: modalidadPhysics } = await buildModalidadItemContent(tier);
  const modalidadCenter = new THREE.Vector3(ELEMENTS.modalidades.x, terrain.anchorHeights.modalidades + 9, ELEMENTS.modalidades.z);
  const modalidadGroup = new THREE.Group();
  modalidadGroup.position.copy(modalidadCenter);
  modalidadGroup.add(modalidadPoints);
  islandGroup.add(modalidadGroup);

  // A small market stall beside the floating carousel item — a real element
  // for it to be "displayed at" instead of just floating over bare ground.
  // Offset to the side rather than directly underneath: the item's noise-
  // displaced placeholder geometry reaches down far enough that a stall
  // directly below it got swallowed inside the particle cloud's own
  // silhouette (confirmed by screenshot — the stall was completely invisible
  // there), not actually sitting beside/under it the way the counter+sign
  // shape reads when it has room to be seen.
  const shopStall = createShopStall({
    position: new THREE.Vector3(ELEMENTS.modalidades.x + 10, terrain.anchorHeights.modalidades, ELEMENTS.modalidades.z - 2),
  });
  islandGroup.add(shopStall);

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
  const bedCenter = new THREE.Vector3(ELEMENTS.cta.x, terrain.anchorHeights.cta, ELEMENTS.cta.z);

  const { points: bedPoints, physics: bedPhysics } = await buildBedwarsContent(tier);
  const bedGroup = new THREE.Group();
  bedGroup.position.copy(bedCenter);
  bedGroup.add(bedPoints);
  islandGroup.add(bedGroup);

  const { points: camperPoints, physics: camperPhysics } = await buildHero(skinUrl, tier);
  const camperGroup = new THREE.Group();
  // Offset diagonally, not just along one axis — purely-sideways placement
  // put it directly in front of the bed from the station's own camera
  // angle, merging the two into one blob instead of reading as two things.
  camperGroup.position.set(bedCenter.x + 11, terrain.anchorHeights.cta, bedCenter.z + 9);
  camperGroup.scale.setScalar(0.6);
  camperGroup.rotation.y = -Math.PI / 3;
  camperGroup.add(camperPoints);
  islandGroup.add(camperGroup);

  // Team wool by the bed — the single most literal real Bedwars element
  // there is, and cheap: solid color, no texture needed to read correctly.
  // Offset back toward the island center (not outward) — an outward offset
  // here landed it right at the flattened clearing's own edge, reading as
  // "about to fall off" instead of "next to the bed".
  const wool = createWoolCluster({
    position: new THREE.Vector3(bedCenter.x + 6, terrain.anchorHeights.cta, bedCenter.z - 5),
    color: 0xe8342a,
  });
  islandGroup.add(wool);

  const bedLabel = createHudLabel({
    container,
    camera,
    getObject: () => bedGroup,
    anchor: new THREE.Vector3(0, 5, 0),
    title: 'CODEVAMP_04',
    sub: 'DEFEND.BED',
  });

  // One pose per station, each orbiting its own anchor's center (ELEMENTS
  // above, or the island/void center for the overview and hero stations) —
  // a real change of place each time progress crosses a station, not just a
  // wider-angle look at the same spot. Each on-island anchor's own `angle`
  // (used to place it on the island, above) is reused here too, so every one
  // of those cameras looks back in toward the island center with its
  // subject silhouetted against the rest of the island instead of the void.
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

  const islandCenter = new THREE.Vector3(ISLAND.center.x, terrain.standingHeight, ISLAND.center.z);

  // Five stations: a wide establishing shot of the whole island (plus a
  // couple background islands) first — the "ver todo el ambiente" beat —
  // then each real element in turn, then the void drop for the hero reveal
  // last. `STATION_SKY` (same length, same order) is what applyProgressEffects
  // below lerps between; only the last entry differs from the shared island
  // sky.
  const stations = [
    orbitStation(islandCenter, 45, 150, 100, 15),                                                  // overview
    orbitStation(destacadoCenter, ELEMENTS.destacado.angle, 44, 22, 10),                          // destacado — the generator
    orbitStation(modalidadCenter, ELEMENTS.modalidades.angle, 42, 15, 6),                         // modalidades — its own object
    orbitStation(bedCenter, ELEMENTS.cta.angle, 52, 19, 4),                                       // cta — the Bedwars bed + camper
    orbitStation(heroVoidCenter, 200, 42, -10, FIGURE_HEIGHT * 0.5),                                // hero — below, looking at it directly
  ];
  const STATION_SKY = [SKY_COLOR, SKY_COLOR, SKY_COLOR, SKY_COLOR, VOID_COLOR];
  const cameraRig = createCameraRig({ camera, stations });
  let currentProgress = 0;

  // Built before the first setProgress() call below — applyProgressEffects
  // reads it for the void station's flash. Only built when transitions can
  // actually happen: with reduceMotion there's no virtual-scroll, progress
  // never changes, so the composer would just be pure overhead for a
  // passthrough render.
  const postProcessing = reduceMotion ? null : createPostProcessing(renderer, scene, camera);

  const _fogA = new THREE.Color();
  const _fogB = new THREE.Color();
  // The hero station (index 4) is a hard cut to a different place, not a
  // continuous move through the same space — per feedback, dragging the
  // camera down through the same island/props for that reveal both cost
  // rendering the whole world for no reason and made the shot read as
  // "pointing at the island" instead of a clean cut to the character. Hiding
  // islandGroup (skips its draw calls entirely, real render cost saved) and
  // masking the pop with a flash timed to the exact midpoint of the two
  // transitions next to station 4 (cta→hero, hero→overview) means the
  // toggle itself is never actually visible — postProcessing is null in
  // reduceMotion (no transitions ever happen then, so it's moot).
  function applyProgressEffects(progress) {
    const n = STATION_SKY.length;
    const wrapped = ((progress % n) + n) % n;
    const i0 = Math.floor(wrapped);
    const i1 = (i0 + 1) % n;
    const t = wrapped - i0;

    _fogA.set(STATION_SKY[i0]);
    _fogB.set(STATION_SKY[i1]);
    scene.fog.color.copy(_fogA).lerp(_fogB, t);
    scene.background.copy(scene.fog.color);

    const isVoidAdjacent = i0 === 4 || i1 === 4;
    if (postProcessing) postProcessing.setFlash(isVoidAdjacent ? Math.sin(t * Math.PI) : 0);

    const showWorld = !isVoidAdjacent || (i0 === 4 ? t >= 0.5 : t < 0.5);
    islandGroup.visible = showWorld;
    modalidadLabel.setHidden(!showWorld);
    bedLabel.setHidden(!showWorld);
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
    for (const bg of backgroundIslands) bg.userData.dispose();
    generator.userData.dispose();
    shopStall.userData.dispose();
    wool.userData.dispose();
    renderer.dispose();
  }

  return {
    dispose,
    camera,
    setModalidadItem,
    getModalidadIndex: () => modalidadIndex,
  };
}
