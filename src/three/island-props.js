import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCrystalCluster } from './terrain.js';

function mergeColoredBoxes(pieces) {
  for (const { geo, color } of pieces) {
    const colors = [];
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) colors.push(color.r, color.g, color.b);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  const merged = mergeGeometries(pieces.map((p) => p.geo));
  for (const { geo } of pieces) geo.dispose();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.04 });
  const mesh = new THREE.Mesh(merged, material);
  mesh.userData.dispose = () => {
    merged.dispose();
    material.dispose();
  };
  return mesh;
}

// A clump of solid-colored wool blocks — the most literal "real Bedwars
// element" there is (team color, no texture needed to read correctly).
// Irregular per-block size/offset so it reads as a dropped clump of blocks
// rather than one uniform slab.
export function createWoolCluster({ position, color = 0xe8342a, count = 6, spread = 3 } = {}) {
  const woolColor = new THREE.Color(color);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const s = 1.3 + Math.random() * 0.9;
    const geo = new THREE.BoxGeometry(s, s, s);
    const ox = (Math.random() - 0.5) * spread * 2;
    const oz = (Math.random() - 0.5) * spread * 2;
    geo.translate(ox, s / 2, oz);
    pieces.push({ geo, color: woolColor });
  }
  const mesh = mergeColoredBoxes(pieces);
  mesh.position.copy(position);
  return mesh;
}

// The Modalidades anchor's real element — a small market stall (counter +
// two posts + a sign) for the floating carousel item to sit above, instead
// of floating alone over bare ground.
export function createShopStall({ position } = {}) {
  const wood = new THREE.Color(0x8a5a34);
  const sign = new THREE.Color(0xe8342a);
  const pieces = [];

  const counter = new THREE.BoxGeometry(6, 2.4, 3);
  counter.translate(0, 1.2, 0);
  pieces.push({ geo: counter, color: wood });

  const postL = new THREE.BoxGeometry(0.6, 4, 0.6);
  postL.translate(-2.6, 2, -1.6);
  pieces.push({ geo: postL, color: wood });

  const postR = new THREE.BoxGeometry(0.6, 4, 0.6);
  postR.translate(2.6, 2, -1.6);
  pieces.push({ geo: postR, color: wood });

  const signBoard = new THREE.BoxGeometry(6.4, 1.6, 0.4);
  signBoard.translate(0, 4.4, -1.6);
  pieces.push({ geo: signBoard, color: sign });

  const mesh = mergeColoredBoxes(pieces);
  mesh.position.copy(position);
  return mesh;
}

// The Destacado anchor's real element — a resource generator, the natural
// focal point of any Bedwars island. Reuses createCrystalCluster's cone-
// cluster technique as-is (it's already just "colored spikes around a
// point" — a generator is a smaller, tighter, brighter-colored version of
// the same shape, not a different one), tuned down from the icebergs' scale.
export function createGenerator({ position, colorLow = 0x0e3d3a, colorHigh = 0x5ef2c8 } = {}) {
  return createCrystalCluster({
    center: position,
    count: 9,
    spread: 7,
    minHeight: 6,
    maxHeight: 15,
    colorLow,
    colorHigh,
  });
}
