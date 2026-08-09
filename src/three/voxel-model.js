import * as THREE from 'three';
import vertexShader from './shaders/particle.vert.js';
import fragmentShader from './shaders/particle.frag.js';

export function createVoxelModel({ positions, colors, seeds, reference }) {
  const geometry = new THREE.BufferGeometry();
  // Three.js needs a `position` attribute to know how many vertices to draw
  // — the vertex shader ignores its actual values and instead samples the
  // GPU-computed position from `uPositionTexture` via `aReference`, which
  // is what's actually mutated frame to frame now (see particle-physics.js).
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aReference', new THREE.BufferAttribute(reference, 2));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPointSize: { value: 2.1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uPositionTexture: { value: null },
    },
  });

  const points = new THREE.Points(geometry, material);
  // Particles get pushed well outside the rest-pose bounding sphere on
  // cursor hits — recomputing it every frame isn't worth it for a single
  // always-on-screen hero object, so just never cull it.
  points.frustumCulled = false;
  return points;
}
