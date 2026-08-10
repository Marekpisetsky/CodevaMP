import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT, FIGURE_CENTER_Y } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { TIERS, resolvePixelRatio } from './device-quality.js';
import { createStage } from './stage.js';

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

  return { points, physics, extraObjects: [createGroundRing()] };
}

export async function createHeroScene(container, skinUrl) {
  return createStage({
    container,
    buildContent: (tier) => buildParticleSystem(skinUrl, tier),
    cameraConfig: {
      centerY: FIGURE_CENTER_Y,
      halfHeight: FIGURE_HEIGHT * 0.66,
      // Neutral for now (Fase 1: hero must look/behave identical to before
      // the stage.js extraction) — scroll-orchestrator.js still drives
      // setFocus() so the wiring is proven end-to-end, it just has no
      // visible effect yet. Fase 2 gives this real idle/settled values.
      idleZoom: 1,
      settledZoom: 1,
    },
  });
}
