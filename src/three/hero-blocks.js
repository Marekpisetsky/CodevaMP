import * as THREE from 'three';
import { PARTS, resolvePartRegions, FIGURE_CENTER_Y } from './skin-parser.js';
import { createHudLabel } from './hud-label.js';

const SKIN_SIZE = 64; // standard Minecraft skin resolution — see skin-parser.js

// Same per-face corner formulas as skin-parser.js's sampleFace(), evaluated
// at the 4 extreme (jdu, jdv) corners instead of interpolated samples — this
// keeps the rigid blocks' UV mapping consistent with the particle system's
// (already-verified-correct) mapping instead of re-deriving it from scratch.
function faceCorners(face, box) {
  const hw = box.w / 2, hh = box.h / 2, hd = box.d / 2;
  const { w, h, cx, cy, cz } = box;
  switch (face) {
    case 'front': return [
      [cx + hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz + hd],
      [cx + hw, cy - hh, cz + hd], [cx - hw, cy - hh, cz + hd],
    ];
    case 'back': return [
      [cx - hw, cy + hh, cz - hd], [cx + hw, cy + hh, cz - hd],
      [cx - hw, cy - hh, cz - hd], [cx + hw, cy - hh, cz - hd],
    ];
    case 'right': return [
      [cx + hw, cy + hh, cz - hd], [cx + hw, cy + hh, cz + hd],
      [cx + hw, cy - hh, cz - hd], [cx + hw, cy - hh, cz + hd],
    ];
    case 'left': return [
      [cx - hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz - hd],
      [cx - hw, cy - hh, cz + hd], [cx - hw, cy - hh, cz - hd],
    ];
    case 'top': return [
      [cx + hw, cy + hh, cz - hd], [cx - hw, cy + hh, cz - hd],
      [cx + hw, cy + hh, cz + hd], [cx - hw, cy + hh, cz + hd],
    ];
    default: return [ // bottom
      [cx + hw, cy - hh, cz + hd], [cx - hw, cy - hh, cz + hd],
      [cx + hw, cy - hh, cz - hd], [cx - hw, cy - hh, cz - hd],
    ];
  }
}

const FACE_NORMALS = {
  front: [0, 0, 1], back: [0, 0, -1],
  right: [1, 0, 0], left: [-1, 0, 0],
  top: [0, 1, 0], bottom: [0, -1, 0],
};

function buildPartGeometry(box, rects) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vertexOffset = 0;

  for (const face of Object.keys(rects)) {
    const rect = rects[face];
    const corners = faceCorners(face, box); // [P00, P10, P01, P11]
    const normal = FACE_NORMALS[face];

    const u0 = rect.u / SKIN_SIZE, u1 = (rect.u + rect.w) / SKIN_SIZE;
    const v0 = 1 - rect.v / SKIN_SIZE, v1 = 1 - (rect.v + rect.h) / SKIN_SIZE;
    const faceUvs = [[u0, v0], [u1, v0], [u0, v1], [u1, v1]];

    for (let i = 0; i < 4; i++) {
      positions.push(...corners[i]);
      normals.push(...normal);
      uvs.push(...faceUvs[i]);
    }
    indices.push(
      vertexOffset, vertexOffset + 2, vertexOffset + 1,
      vertexOffset + 1, vertexOffset + 2, vertexOffset + 3,
    );
    vertexOffset += 4;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

const EXPLODE_DAMPING = 6;
const EXPLODE_RADIUS = 15; // how close the cursor needs to be (local units) to fully separate a block
const EXPLODE_DISTANCE = 3.5;

export async function createHeroBlocks(skinUrl, { hudContainer, camera } = {}) {
  const parts = await resolvePartRegions(skinUrl);

  const texture = new THREE.TextureLoader().load(skinUrl);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0.04,
    side: THREE.DoubleSide, // safety net until winding is confirmed correct for every face
  });

  const group = new THREE.Group();
  const blocks = parts.map((part, i) => {
    const geometry = buildPartGeometry(part.box, part.rects);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const basePosition = new THREE.Vector3(part.box.cx, part.box.cy, part.box.cz);
    // Explode outward from the figure's vertical centerline, not the world
    // origin — so the head flies up/out and the legs fly down/out instead
    // of everything radiating from a single point at hip height.
    const away = new THREE.Vector3(part.box.cx, part.box.cy - FIGURE_CENTER_Y, part.box.cz);
    if (away.lengthSq() < 0.0001) away.set(0, 1, 0);
    away.normalize();

    return {
      id: part.name,
      mesh,
      basePosition,
      explodeDir: away,
      factor: 0,
      label: null,
      // Mutated every frame to basePosition + current explode offset and
      // handed to hud-label.js as its anchor — hud-label re-reads this
      // vector's live value each frame, so the label tracks the block as it
      // separates instead of staying pinned to its assembled position.
      labelAnchor: basePosition.clone(),
      hudNumber: 12 + i * 17 + Math.floor(Math.random() * 9), // decorative, matches the reference's arbitrary-looking per-block numbers
    };
  });

  function update(dt, cursorLocal) {
    for (const block of blocks) {
      let targetFactor = 0;
      if (cursorLocal) {
        const d = block.basePosition.distanceTo(cursorLocal);
        targetFactor = THREE.MathUtils.clamp(1 - d / EXPLODE_RADIUS, 0, 1);
      }

      block.factor += (targetFactor - block.factor) * (1 - Math.exp(-EXPLODE_DAMPING * dt));

      // Each mesh's own geometry is already authored in figure-space
      // (box.cx/cy/cz baked straight into its vertex positions), so
      // mesh.position only ever needs to carry the *extra* explode offset,
      // not the block's base location.
      block.mesh.position.copy(block.explodeDir).multiplyScalar(block.factor * EXPLODE_DISTANCE);
      block.labelAnchor.copy(block.basePosition).add(block.mesh.position);

      const active = block.factor > 0.04;
      if (active && !block.label && hudContainer && camera) {
        block.label = createHudLabel({
          container: hudContainer,
          camera,
          getObject: () => group,
          anchor: block.labelAnchor,
          title: String(block.hudNumber),
          sub: '',
        });
      } else if (!active && block.label) {
        block.label.dispose();
        block.label = null;
      }
    }
  }

  function dispose() {
    for (const block of blocks) {
      block.mesh.geometry.dispose();
      if (block.label) block.label.dispose();
    }
    material.dispose();
    texture.dispose();
  }

  return { group, update, dispose, blocks };
}
