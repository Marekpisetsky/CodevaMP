import * as THREE from 'three';
import { sampleGeometry } from './mesh-sampler.js';
import { createParticlePhysics } from './particle-physics.js';
import { createVoxelModel } from './voxel-model.js';
import { TIERS, resolvePixelRatio } from './device-quality.js';

// The Bedwars bed — particles, like every other object in this world (the
// rigid-block "exploded view" treatment in hero-blocks.js was tried on the
// hero character first and didn't read right there; per feedback this
// technique is being dropped in favor of keeping everything in the same
// particle language as the hero and the Modalidades objects instead).
// Sampled per-part with a different color each, same pattern
// mesh-sampler.js's loadAndSampleGLB already uses for multi-mesh .glb
// files — no new geometry-merging utility needed.
function buildBedParts() {
  const white = new THREE.Color(0xf5f5f7); // --white, sheets
  const red = new THREE.Color(0xe8342a); // --red, blanket/headboard
  const dark = new THREE.Color(0x1b1b1e); // --bg-panel-alt, frame/legs

  const mattress = new THREE.BoxGeometry(7, 2, 12);
  mattress.translate(0, 1, -1);

  const blanket = new THREE.BoxGeometry(7.2, 0.6, 5);
  blanket.translate(0, 2.3, 2.5);

  const headboard = new THREE.BoxGeometry(7, 4, 2);
  headboard.translate(0, 2, -7);

  const legOffsets = [[-3, -0.75, 5], [3, -0.75, 5], [-3, -0.75, -7], [3, -0.75, -7]];
  const legs = legOffsets.map(([x, y, z]) => {
    const g = new THREE.BoxGeometry(1, 1.5, 1);
    g.translate(x, y, z);
    return g;
  });

  return [
    { geometry: mattress, color: white, share: 0.42 },
    { geometry: blanket, color: red, share: 0.2 },
    { geometry: headboard, color: red, share: 0.22 },
    ...legs.map((geometry) => ({ geometry, color: dark, share: 0.04 })),
  ];
}

export async function buildBedwarsContent(tier) {
  const config = TIERS[tier];
  const budget = Math.max(2000, Math.round(config.particleBudget * 0.18));

  const parts = buildBedParts();
  const merged = { positions: [], colors: [], normals: [], seeds: [] };
  for (const part of parts) {
    const sampled = sampleGeometry(part.geometry, {
      targetCount: Math.max(50, Math.round(budget * part.share)),
      color: part.color,
    });
    for (let i = 0; i < sampled.positions.length; i++) merged.positions.push(sampled.positions[i]);
    for (let i = 0; i < sampled.colors.length; i++) merged.colors.push(sampled.colors[i]);
    for (let i = 0; i < sampled.normals.length; i++) merged.normals.push(sampled.normals[i]);
    for (let i = 0; i < sampled.seeds.length; i++) merged.seeds.push(sampled.seeds[i]);
    part.geometry.dispose();
  }

  const positions = new Float32Array(merged.positions);
  const count = positions.length / 3;

  const physics = createParticlePhysics({
    basePositions: positions,
    count,
    interactionRadius: config.interactionRadius * 0.6,
    noiseComplexity: config.noiseComplexity,
  });
  const points = createVoxelModel({
    positions: physics.positions,
    colors: new Float32Array(merged.colors),
    normals: new Float32Array(merged.normals),
    seeds: new Float32Array(merged.seeds),
    pointSize: config.pointSize * 0.85,
    pixelRatio: resolvePixelRatio(tier),
    ambientJitter: 0.14,
  });

  return { points, physics };
}
