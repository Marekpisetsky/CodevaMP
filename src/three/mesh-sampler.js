import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// sin(i * constant) alone is NOT per-particle randomness (see
// particle-physics.js's git history for why) — this hash properly
// decorrelates each particle.
function hash(n) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

function triangleCount(geometry) {
  return geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
}

function getTriangleVertex(geometry, triIndex, corner, out) {
  const i = triIndex * 3 + corner;
  const vertexIndex = geometry.index ? geometry.index.getX(i) : i;
  out.fromBufferAttribute(geometry.attributes.position, vertexIndex);
}

// Triangle areas (for area-weighted sampling) + their sum (for splitting a
// particle budget across multiple meshes proportional to surface area).
function computeTriangleAreas(geometry) {
  const triCount = triangleCount(geometry);
  const areas = new Float32Array(triCount);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cross = new THREE.Vector3();
  let totalArea = 0;

  for (let t = 0; t < triCount; t++) {
    getTriangleVertex(geometry, t, 0, a);
    getTriangleVertex(geometry, t, 1, b);
    getTriangleVertex(geometry, t, 2, c);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    cross.crossVectors(ab, ac);
    const area = cross.length() * 0.5;
    areas[t] = area;
    totalArea += area;
  }

  return { areas, totalArea: totalArea || 1 };
}

// Surface-samples a BufferGeometry proportional to triangle area, producing
// the same {positions, colors, normals, seeds, count} contract skin-parser.js
// does — so particle-physics.js / voxel-model.js / the shaders (face-normal
// lighting included) work completely unchanged regardless of whether the
// source is a Minecraft skin or a loaded mesh.
export function sampleGeometry(geometry, { targetCount = 6000, color = new THREE.Color(0xe8342a) } = {}) {
  const { areas, totalArea } = computeTriangleAreas(geometry);
  const triCount = areas.length;

  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), normal = new THREE.Vector3(), p = new THREE.Vector3();

  const positions = [];
  const colors = [];
  const normals = [];

  for (let t = 0; t < triCount; t++) {
    const samples = Math.round((areas[t] / totalArea) * targetCount);
    if (samples <= 0) continue;

    getTriangleVertex(geometry, t, 0, a);
    getTriangleVertex(geometry, t, 1, b);
    getTriangleVertex(geometry, t, 2, c);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();

    for (let s = 0; s < samples; s++) {
      let r1 = Math.random(), r2 = Math.random();
      if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; } // reflect into the triangle
      p.copy(a).addScaledVector(ab, r1).addScaledVector(ac, r2);
      positions.push(p.x, p.y, p.z);
      colors.push(color.r, color.g, color.b);
      normals.push(normal.x, normal.y, normal.z);
    }
  }

  const count = positions.length / 3;
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = hash(i * 12.9898 + 78.233);

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    normals: new Float32Array(normals),
    seeds,
    count,
  };
}

const loader = new GLTFLoader();

// Loads a .glb, samples every mesh in it (particle budget split across
// meshes proportional to surface area so a small detail piece doesn't get
// the same share as the model's main body), returns one merged
// {positions, colors, normals, seeds, count} — same contract as above.
export function loadAndSampleGLB(url, { targetCount = 6000 } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const meshes = [];
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((child) => {
          if (child.isMesh) meshes.push(child);
        });
        if (meshes.length === 0) {
          reject(new Error('glb has no meshes: ' + url));
          return;
        }

        const prepared = meshes.map((mesh) => {
          const geometry = mesh.geometry.clone();
          geometry.applyMatrix4(mesh.matrixWorld);
          const color = mesh.material && mesh.material.color ? mesh.material.color.clone() : new THREE.Color(0xffffff);
          return { geometry, color, area: computeTriangleAreas(geometry).totalArea };
        });
        const totalArea = prepared.reduce((sum, m) => sum + m.area, 0) || 1;

        const merged = { positions: [], colors: [], normals: [], seeds: [] };
        for (const { geometry, color, area } of prepared) {
          const share = Math.max(200, Math.round((area / totalArea) * targetCount));
          const sampled = sampleGeometry(geometry, { targetCount: share, color });
          for (let i = 0; i < sampled.positions.length; i++) merged.positions.push(sampled.positions[i]);
          for (let i = 0; i < sampled.colors.length; i++) merged.colors.push(sampled.colors[i]);
          for (let i = 0; i < sampled.normals.length; i++) merged.normals.push(sampled.normals[i]);
          for (let i = 0; i < sampled.seeds.length; i++) merged.seeds.push(sampled.seeds[i]);
          geometry.dispose();
        }

        resolve({
          positions: new Float32Array(merged.positions),
          colors: new Float32Array(merged.colors),
          normals: new Float32Array(merged.normals),
          seeds: new Float32Array(merged.seeds),
          count: merged.positions.length / 3,
        });
      },
      undefined,
      reject,
    );
  });
}
