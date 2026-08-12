import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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

// The island's one piece of content for now — a simple Minecraft-style
// house (solid-block walls, a peaked roof, a door, a chimney), no explosion/
// separation animation yet (that idea, and the pointillist hero standing
// here, are deliberately deferred to a later scene per feedback — this pass
// is meant to stay simple: walls, roof, done).
export function createMinecraftHouse({ position } = {}) {
  const wallColor = new THREE.Color(0xcbbd96); // oak-plank tan
  const roofColor = new THREE.Color(0x7a231c); // brand-adjacent dark red, also a classic Minecraft roof tone
  const doorColor = new THREE.Color(0x4a2f1a);
  const chimneyColor = new THREE.Color(0x8a8a8a);
  const pieces = [];

  const w = 12, d = 10, wallH = 7;

  const walls = new THREE.BoxGeometry(w, wallH, d);
  walls.translate(0, wallH / 2, 0);
  pieces.push({ geo: walls, color: wallColor });

  // Roof: two slabs angled up from the eaves to meet at a ridge above the
  // center — the standard two-plane peaked-roof trick, no custom geometry.
  const roofRise = 4.2;
  const roofRun = d / 2 + 1.2; // overhangs the walls slightly
  const roofAngle = Math.atan2(roofRise, roofRun);
  const roofLen = Math.hypot(roofRise, roofRun);
  const roofW = w + 1.6;
  const roofThickness = 0.8;

  const roofFront = new THREE.BoxGeometry(roofW, roofThickness, roofLen);
  roofFront.rotateX(roofAngle);
  roofFront.translate(0, wallH + roofRise / 2, roofRun / 2);
  pieces.push({ geo: roofFront, color: roofColor });

  const roofBack = new THREE.BoxGeometry(roofW, roofThickness, roofLen);
  roofBack.rotateX(-roofAngle);
  roofBack.translate(0, wallH + roofRise / 2, -roofRun / 2);
  pieces.push({ geo: roofBack, color: roofColor });

  // Door — flush against the front wall face, not a real cutout (no CSG),
  // but reads correctly at this scale.
  const door = new THREE.BoxGeometry(2.2, 3.4, 0.3);
  door.translate(0, 1.7, d / 2 + 0.05);
  pieces.push({ geo: door, color: doorColor });

  // Chimney — the one extra silhouette detail that reads as "house" from
  // any angle, including straight down the ridge line where the roof alone
  // is a flat triangle.
  const chimney = new THREE.BoxGeometry(1.4, 4.5, 1.4);
  chimney.translate(w / 2 - 2.4, wallH + roofRise * 0.55 + 1.6, 0);
  pieces.push({ geo: chimney, color: chimneyColor });

  const mesh = mergeColoredBoxes(pieces);
  mesh.position.copy(position);
  return mesh;
}
