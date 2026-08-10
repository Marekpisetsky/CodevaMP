import * as THREE from 'three';

// Stand-in for the real .glb models (Fase 5, before those exist): a
// noise-displaced icosahedron per item, varied by `seed` so the 6 read as
// distinct without any new art — swap for loadAndSampleGLB() once the real
// assets are ready, nothing else in the pipeline needs to change.
export function createPlaceholderGeometry(seed = 0) {
  const geometry = new THREE.IcosahedronGeometry(6, 2);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const noise =
      Math.sin(n.x * 3.1 + seed * 7.7) * Math.cos(n.y * 2.7 + seed * 3.1) * 0.9 +
      Math.sin(n.z * 4.3 + seed * 5.3) * 0.5;
    v.addScaledVector(n, noise);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
