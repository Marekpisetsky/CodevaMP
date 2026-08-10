import * as THREE from 'three';
import { createStage } from './stage.js';
import { createHudLabel } from './hud-label.js';
import { createParticlePhysics } from './particle-physics.js';
import { createVoxelModel } from './voxel-model.js';
import { sampleGeometry, loadAndSampleGLB } from './mesh-sampler.js';
import { createPlaceholderGeometry } from './placeholder-geometry.js';
import { TIERS, resolvePixelRatio } from './device-quality.js';
import { PORTFOLIO_ITEMS } from './portfolio-items.js';

// A single compact object doesn't need the hero's full particle budget —
// same tier system, smaller slice of it.
async function buildItemContent(item, itemIndex, tier) {
  const config = TIERS[tier];
  const budget = Math.max(1500, Math.round(config.particleBudget * 0.14));

  let sampled;
  if (item.glbUrl) {
    sampled = await loadAndSampleGLB(item.glbUrl, { targetCount: budget });
  } else {
    const geometry = createPlaceholderGeometry(itemIndex);
    sampled = sampleGeometry(geometry, { targetCount: budget, color: new THREE.Color(item.color) });
    geometry.dispose();
  }
  if (sampled.count === 0) throw new Error('empty sample for item: ' + item.id);

  const physics = createParticlePhysics({
    basePositions: sampled.positions,
    count: sampled.count,
    interactionRadius: config.interactionRadius * 0.6,
    noiseComplexity: config.noiseComplexity,
  });
  const points = createVoxelModel({
    positions: physics.positions,
    colors: sampled.colors,
    normals: sampled.normals,
    seeds: sampled.seeds,
    pointSize: config.pointSize * 0.85,
    pixelRatio: resolvePixelRatio(tier),
    ambientJitter: 0.16,
  });

  return { points, physics };
}

// One stage instance for the whole carousel — switching items calls
// stage.setContent() to swap the particle content in place rather than
// tearing down the renderer/camera/loop each time.
export async function createModalidadScene(container) {
  let currentIndex = 0;

  const stage = await createStage({
    container,
    buildContent: (tier) => buildItemContent(PORTFOLIO_ITEMS[currentIndex], currentIndex, tier),
    cameraConfig: {
      centerY: 0,
      halfHeight: 9,
      idleZoom: 1,
      settledZoom: 0.85,
    },
  });

  const label = createHudLabel({
    container,
    camera: stage.camera,
    getObject: stage.getContentObject,
    anchor: new THREE.Vector3(0, 6.5, 0),
    title: PORTFOLIO_ITEMS[0].tag,
    sub: PORTFOLIO_ITEMS[0].stat,
  });

  async function setItem(index) {
    currentIndex = ((index % PORTFOLIO_ITEMS.length) + PORTFOLIO_ITEMS.length) % PORTFOLIO_ITEMS.length;
    const item = PORTFOLIO_ITEMS[currentIndex];
    await stage.setContent((tier) => buildItemContent(item, currentIndex, tier));
    label.setText(item.tag, item.stat);
    return item;
  }

  const dispose = stage.dispose;
  stage.dispose = () => {
    label.dispose();
    dispose();
  };

  return { ...stage, setItem, getCurrentIndex: () => currentIndex };
}
