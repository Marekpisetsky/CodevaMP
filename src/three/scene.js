import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT, FIGURE_CENTER_Y } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createCursorTracker } from './cursor-interaction.js';
import { createParticlePhysics } from './particle-physics.js';
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

export async function createHeroScene(container, skinUrl) {
  const skinData = await parseSkin(skinUrl);
  if (skinData.count === 0) throw new Error('empty skin: no opaque pixels parsed');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

  const physics = createParticlePhysics({ renderer, basePositions: skinData.positions, count: skinData.count });
  const reference = buildReferenceUvs(skinData.count, physics.size);
  const points = createVoxelModel({
    positions: skinData.positions,
    colors: skinData.colors,
    seeds: skinData.seeds,
    reference,
  });
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

  const cursor = hoverCapable ? createCursorTracker({ camera, points, renderer }) : null;
  const uniforms = points.material.uniforms;
  let raf = null;
  let lastTime = performance.now();

  function frame(now) {
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    points.rotation.y += delta * 0.35;
    const t = now / 1000;
    uniforms.uTime.value = t;

    const cursorState = cursor ? cursor.update(delta) : null;
    physics.update(delta, cursorState, t);
    uniforms.uPositionTexture.value = physics.getPositionTexture();

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
    // No compute() call: the GPU textures start out equal to the rest pose,
    // so this renders that static shape directly, no jitter implied.
    uniforms.uTime.value = performance.now() / 1000;
    uniforms.uPositionTexture.value = physics.getPositionTexture();
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
    physics.dispose();
    points.geometry.dispose();
    points.material.dispose();
    ring.geometry.dispose();
    ring.material.dispose();
    renderer.dispose();
  }

  return { dispose };
}

// Maps each particle index to the (u, v) texel center it lives at in the
// physics sim's square textures — same row-major i -> (i % size, i / size)
// layout particle-physics.js uses to fill the initial position data, so a
// given index always reads back the position it was written to.
function buildReferenceUvs(count, size) {
  const reference = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = i % size;
    const y = Math.floor(i / size);
    reference[i * 2] = (x + 0.5) / size;
    reference[i * 2 + 1] = (y + 0.5) / size;
  }
  return reference;
}
