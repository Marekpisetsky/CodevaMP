import * as THREE from 'three';
import vertexShader from './shaders/particle.vert.js';
import fragmentShader from './shaders/particle.frag.js';

export function createVoxelModel({ positions, colors, seeds }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
      uCursor: { value: new THREE.Vector3(9999, 9999, 9999) },
      uRadius: { value: 12 },
      uStrength: { value: 0 },
      uPointSize: { value: 2.1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uFlowStrength: { value: 0.14 },
      uPushDistance: { value: 16 },
    },
  });

  const points = new THREE.Points(geometry, material);
  points.geometry.computeBoundingSphere();
  return points;
}
