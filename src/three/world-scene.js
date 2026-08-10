import * as THREE from 'three';
import { FIGURE_HEIGHT } from './skin-parser.js';
import { createHeroBlocks } from './hero-blocks.js';
import { createCursorTracker } from './cursor-interaction.js';
import { guessInitialTier, resolvePixelRatio } from './device-quality.js';
import { createTerrain, createMovingMist } from './terrain.js';
import { reduceMotion, hoverCapable } from '../js/utils/motion-prefs.js';

// Fase 1+2 of the world-as-a-single-scene pivot (see plan): the hero stands
// in a real 3D environment (voxel terrain + moving mist), viewed with a
// PerspectiveCamera, and is now built from real rigid Minecraft-block
// meshes (hero-blocks.js) instead of particles — the blocks separate into
// an "exploded view" near the cursor instead of scattering like particles.
// Camera choreography (Fase 3) still lands later; this camera is static.
// CTA/destacado/modalidades still use the older stage.js pipeline for now;
// they migrate into this world in Fase 4/5.
export async function createWorldScene(container, skinUrl) {
  const tier = guessInitialTier();
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

  const heroGroup = new THREE.Group();
  heroGroup.position.set(0, terrain.standingHeight, 0);
  scene.add(heroGroup);

  const heroBlocks = await createHeroBlocks(skinUrl, { hudContainer: container, camera });
  heroGroup.add(heroBlocks.group);

  // Static for Fase 1/2 — elevated, pulled-back angle so terrain/mist read
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

  // Reused across cursor.update() calls — see hero-blocks.js's update(),
  // which wants a Vector3 in the group's local space, not the
  // {x,y,z,vx,vy,vz} shape cursor-interaction.js returns.
  const cursorPoint = new THREE.Vector3();
  const cursor = hoverCapable ? createCursorTracker({ camera, points: heroBlocks.group, renderer }) : null;

  let raf = null;
  let lastTime = performance.now();

  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    heroBlocks.group.rotation.y += delta * 0.15;
    const t = now / 1000;
    mist.material.uniforms.uTime.value = t;
    mist2.material.uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    if (cursorState) {
      cursorPoint.set(cursorState.x, cursorState.y, cursorState.z);
      heroBlocks.update(delta, cursorPoint);
    } else {
      heroBlocks.update(delta, null);
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

  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    ensureLoop();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
      else ensureLoop();
    });
  }

  function dispose() {
    stopLoop();
    resizeObserver.disconnect();
    if (cursor) cursor.dispose();
    heroBlocks.dispose();
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
