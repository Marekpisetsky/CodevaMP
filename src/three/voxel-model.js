import * as THREE from 'three';
import vertexShader from './shaders/particle.vert.js';
import fragmentShader from './shaders/particle.frag.js';

export function createVoxelModel({ positions, colors, normals, seeds, pointSize, pixelRatio, ambientJitter = 0.11 }) {
  const geometry = new THREE.BufferGeometry();
  // `positions` is the physics sim's own buffer — mutated in place every
  // frame, so this attribute needs re-uploading (not a static geometry).
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

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
      uPointSize: { value: pointSize },
      uPixelRatio: { value: pixelRatio },
      uAmbientJitter: { value: ambientJitter },
    },
  });

  const points = new THREE.Points(geometry, material);
  // Particles get pushed well outside the rest-pose bounding sphere on
  // cursor hits — recomputing it every frame isn't worth it for a single
  // always-on-screen hero object, so just never cull it.
  points.frustumCulled = false;
  return points;
}
