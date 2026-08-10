import * as THREE from 'three';
import { parseSkin, FIGURE_HEIGHT, FIGURE_CENTER_Y } from './skin-parser.js';
import { createVoxelModel } from './voxel-model.js';
import { createParticlePhysics } from './particle-physics.js';
import { TIERS, resolvePixelRatio } from './device-quality.js';
import { createStage } from './stage.js';
import { createHudLabel } from './hud-label.js';

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
  const stage = await createStage({
    container,
    buildContent: (tier) => buildParticleSystem(skinUrl, tier),
    cameraConfig: {
      centerY: FIGURE_CENTER_Y,
      halfHeight: FIGURE_HEIGHT * 0.66,
      // Smaller frustum = tighter framing = figure reads larger on screen.
      // Settling (hero centered + scroll stopped) eases in a bit tighter
      // than the idle/scrolling framing — the "encuadra al centro" cue.
      idleZoom: 1,
      settledZoom: 0.9,
    },
  });

  const label = createHudLabel({
    container,
    camera: stage.camera,
    getObject: stage.getContentObject,
    anchor: new THREE.Vector3(0, FIGURE_HEIGHT, 0), // top of the head
    title: 'CODEVAMP_01',
    sub: 'VOXEL.RENDER',
  });

  const dispose = stage.dispose;
  stage.dispose = () => {
    label.dispose();
    dispose();
  };

  return stage;
}
