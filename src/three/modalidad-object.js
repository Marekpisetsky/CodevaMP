import * as THREE from 'three';
import { createParticlePhysics } from './particle-physics.js';
import { createVoxelModel } from './voxel-model.js';
import { sampleGeometry, loadAndSampleGLB } from './mesh-sampler.js';
import { createPlaceholderGeometry } from './placeholder-geometry.js';
import { TIERS, resolvePixelRatio } from './device-quality.js';

// Builds the particle content for one Modalidades item (portfolio-items.js)
// — pulled out of the old per-canvas modalidad-scene.js so world-scene.js
// can build/swap this same content as a real object inside the shared
// world instead of a separate small canvas. A single compact object
// doesn't need the hero's full particle budget — same tier system, smaller
// slice of it.
export async function buildModalidadContent(item, itemIndex, tier) {
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
