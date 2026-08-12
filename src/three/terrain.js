import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Small self-contained value-noise (no dependency) — smooth-interpolated
// hashed lattice, fractal-summed for natural-looking rolling terrain before
// it gets quantized into discrete height levels below.
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothNoise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0), b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, octaves = 4) {
  let total = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += smoothNoise(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// A quadratic ramp from the center all the way out to `radius` (the old
// behavior) makes height climb continuously from the very first cell past
// the center — from a camera standing just past the radius looking in, that
// reads as a punchbowl/crater with whatever stands at the true center (a
// station's hero/object) sitting in the bottom of a pit, visually cut off
// from the ground around it. Keeping the inner ~55% genuinely flat (0, not
// "close to 0") and confining the rise to a narrow outer band instead gives
// stations a real flat plateau to stand on, with the terrain only starting
// to climb near the very edge of the clearing.
function flattenFactor(dist, radius) {
  const flatRadius = radius * 0.55;
  if (dist <= flatRadius) return 0;
  if (dist >= radius) return 1;
  return smoothstep(flatRadius, radius, dist);
}

function paintNoiseBand(ctx, { x, y, w, h, base, variance, edgeBand = 0 }) {
  const imageData = ctx.createImageData(w, h);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const idx = (row * w + col) * 4;
      let v = base + (Math.random() - 0.5) * variance;
      if (edgeBand > 0 && row < edgeBand) {
        v += 110 * (1 - row / edgeBand);
      }
      v = Math.max(0, Math.min(255, v));
      imageData.data[idx] = v;
      imageData.data[idx + 1] = v;
      imageData.data[idx + 2] = v;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, x, y);
}

// One neutral/grayscale texture atlas — top half a "grass-top" noise band,
// bottom half a "dirt-side" noise band with a lighter fringe right at the
// seam (the strip that actually reads as "grass growing over dirt").
// InstancedMesh doesn't render per-face multi-material via geometry groups
// the way a regular Mesh does (a real Three.js limitation, not something
// tunable) — a single shared atlas plus remapped UVs on the shared
// geometry (see below) is what makes distinct top/side faces possible
// while keeping this as one InstancedMesh, one draw call. Grayscale is
// deliberate too: the per-instance tint (see the custom `aTint` attribute
// below) multiplies against this, so real per-face texture detail doesn't
// fight each station's own height/zone tint. NearestFilter keeps the
// pixels crisp instead of blurring into a smooth gradient, matching the
// blocky look everywhere else in this scene.
function createTerrainAtlas({ size = 16 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  paintNoiseBand(ctx, { x: 0, y: 0, w: size, h: size, base: 225, variance: 90 });
  paintNoiseBand(ctx, { x: 0, y: size, w: size, h: size, base: 165, variance: 80, edgeBand: 5 });
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A single cube geometry (shared by every instance below) with UVs remapped
// so the top face samples the atlas's grass band and every other face
// samples its dirt band — same trick regardless of what the block ends up
// tinted, so this only needs to happen once.
function createIslandBlockGeometry(cellSize) {
  const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
  // BoxGeometry's fixed vertex layout is 4 UVs per face in order
  // [+x, -x, +y, -y, +z, -z], so face 2 (+y, top) is vertices 8-11.
  const uv = geometry.attributes.uv;
  for (let face = 0; face < 6; face++) {
    const isTop = face === 2;
    for (let v = 0; v < 4; v++) {
      const idx = face * 4 + v;
      const origV = uv.getY(idx);
      uv.setY(idx, isTop ? 0.5 + origV * 0.5 : origV * 0.5);
    }
  }
  uv.needsUpdate = true;
  return geometry;
}

function createIslandMaterial(atlas) {
  const material = new THREE.MeshStandardMaterial({
    map: atlas,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.04,
  });
  // Not vertexColors/setColorAt — in this three.js version that combined
  // with a `map` on an InstancedMesh silently drops the texture entirely
  // (confirmed by testing: MeshBasicMaterial/MeshStandardMaterial with
  // only `map` render it fine; adding vertexColors:true, with per-instance
  // tint coming only from instanceColor rather than a real geometry color
  // attribute, makes the map vanish — a real bug in this combination, not
  // a config mistake). A custom per-instance attribute wired through
  // onBeforeCompile sidesteps it entirely.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'attribute vec3 aTint;\nvarying vec3 vTint;\nvoid main() {\n  vTint = aTint;');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying vec3 vTint;\nvoid main() {')
      .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= vTint;');
  };
  return material;
}

// One real, bounded island instead of an infinite tinted grid: a column
// exists only if it falls inside a radius that's itself perturbed by noise
// (a natural, non-circular coastline instead of a perfect disc), and below
// its surface block it carries a stack of extra blocks going down — deepest
// at the island's center, tapering to nothing at the edge — so the island
// actually has a body and an underside instead of being a single floating
// slab. That underside is the whole point: the site's final "descend below
// the island into the void" beat needs something real to look up at.
//
// `anchors` (world x/z points, each with a `key`) get a flat spot the same
// way the old per-station "zones" used to — an object/camera placed on one
// shouldn't have to fight random noise height under its own feet.
export function createIsland({
  center = { x: 0, z: 0 },
  radius = 70,
  cellSize = 3,
  maxLevels = 10,
  noiseScale = 0.045,
  edgeNoiseScale = 0.02,
  edgeNoiseAmount = 0.3,
  maxUnderDepth = 5,
  // World units, not grid-cell units — the old zones code got this wrong
  // once already (see flattenFactor's callers below) by comparing a
  // world-unit distance against a grid-cell-unit radius, silently making
  // the flat spot ~3x too small. Keeping everything in world units here
  // avoids that unit class of bug entirely.
  clearingRadius = 42,
  anchors = [],
} = {}) {
  const geometry = createIslandBlockGeometry(cellSize);
  const atlas = createTerrainAtlas();
  const material = createIslandMaterial(atlas);

  // Pass 1: walk every candidate column in a square bounding box (big enough
  // to cover the noise-perturbed radius at its widest) and keep only the
  // ones actually inside the island. Membership isn't known ahead of time
  // (unlike the old fixed grid), so the instance count has to be collected
  // first and the InstancedMesh sized to the real total after.
  const halfExtent = Math.ceil((radius * (1 + edgeNoiseAmount)) / cellSize) + 2;
  const columns = [];
  let centerTopLevel = 0;
  const anchorLevels = {};

  // Each anchor's own natural (unflattened) noise value, at its own exact
  // position — what a clearing flattens *toward* below. Flattening straight
  // to 0 (the very lowest level the island's noise can produce anywhere)
  // instead of this reads fine for a single clearing at the one point that
  // already defines "height 0" (the old single-hero-center design), but
  // with several anchors scattered across noisy terrain it forces every one
  // of them down to the island's global minimum regardless of what height
  // its own neighborhood actually sits at — visibly sinking every prop into
  // its own pit below the surrounding grass.
  const anchorTargets = anchors.map((a) => {
    const agx = (a.x - center.x) / cellSize;
    const agz = (a.z - center.z) / cellSize;
    return Math.pow(fbm(agx * noiseScale, agz * noiseScale), 1.5);
  });

  for (let gx = -halfExtent; gx <= halfExtent; gx++) {
    for (let gz = -halfExtent; gz <= halfExtent; gz++) {
      const worldX = center.x + gx * cellSize;
      const worldZ = center.z + gz * cellSize;
      const dx = worldX - center.x, dz = worldZ - center.z;
      const distFromCenter = Math.sqrt(dx * dx + dz * dz);

      const edgeN = fbm(gx * edgeNoiseScale, gz * edgeNoiseScale, 3);
      const effectiveRadius = radius * (1 + (edgeN - 0.5) * 2 * edgeNoiseAmount);
      if (distFromCenter >= effectiveRadius) continue;

      let n = Math.pow(fbm(gx * noiseScale, gz * noiseScale), 1.5);
      // Anchors never overlap (they're spaced far apart relative to
      // clearingRadius), so at most one ever actually pulls on a given
      // column — tracking the single strongest (lowest flatten) one and
      // blending toward *its* natural height is enough, no weighted
      // multi-anchor blend needed.
      let flatten = 1;
      let flattenTarget = n;
      for (let ai = 0; ai < anchors.length; ai++) {
        const anchor = anchors[ai];
        const adx = worldX - anchor.x, adz = worldZ - anchor.z;
        const anchorDist = Math.sqrt(adx * adx + adz * adz);
        const f = flattenFactor(anchorDist, clearingRadius);
        if (f < flatten) {
          flatten = f;
          flattenTarget = anchorTargets[ai];
        }
      }
      n = flattenTarget + (n - flattenTarget) * flatten;

      const topLevel = Math.round(n * maxLevels);
      const edgeT = THREE.MathUtils.clamp(distFromCenter / radius, 0, 1);
      const underDepth = Math.round(maxUnderDepth * Math.pow(1 - edgeT, 1.5));

      columns.push({ worldX, worldZ, topLevel, underDepth, heightT: THREE.MathUtils.clamp(n, 0, 1) });
      if (distFromCenter < cellSize * 0.5) centerTopLevel = topLevel;
      for (const anchor of anchors) {
        const adx = worldX - anchor.x, adz = worldZ - anchor.z;
        if (Math.sqrt(adx * adx + adz * adz) < cellSize * 0.5) anchorLevels[anchor.key] = topLevel;
      }
    }
  }

  // Real Minecraft-ish colors this time (grass green / dirt brown / stone
  // grey) instead of the old per-station tint — one shared island doesn't
  // need a palette per zone anymore, it needs to actually look like ground.
  const grassLow = new THREE.Color(0x3c6b2a);
  const grassMid = new THREE.Color(0x5c9c3e);
  const grassHigh = new THREE.Color(0x8fd45a);
  const dirtColor = new THREE.Color(0x6b4a30);
  const stoneColor = new THREE.Color(0x59565c);
  const grass = new THREE.Color();
  const under = new THREE.Color();

  const positions = [];
  const colors = [];
  for (const col of columns) {
    grass.copy(grassLow).lerp(grassMid, Math.min(1, col.heightT / 0.5));
    if (col.heightT >= 0.5) grass.copy(grassMid).lerp(grassHigh, (col.heightT - 0.5) / 0.5);
    positions.push(col.worldX, col.topLevel * cellSize, col.worldZ);
    colors.push(grass.r, grass.g, grass.b);

    for (let d = 1; d <= col.underDepth; d++) {
      const dt = Math.min(1, d / Math.max(1, maxUnderDepth));
      under.copy(dirtColor).lerp(stoneColor, smoothstep(0.35, 1, dt));
      positions.push(col.worldX, (col.topLevel - d) * cellSize, col.worldZ);
      colors.push(under.r, under.g, under.b);
    }
  }

  const count = positions.length / 3;
  const tintArray = new Float32Array(count * 3);
  geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tintArray, 3));

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.userData.dispose = () => {
    geometry.dispose();
    atlas.dispose();
    material.dispose();
  };

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    tintArray[i * 3] = colors[i * 3];
    tintArray[i * 3 + 1] = colors[i * 3 + 1];
    tintArray[i * 3 + 2] = colors[i * 3 + 2];
  }

  mesh.instanceMatrix.needsUpdate = true;
  geometry.attributes.aTint.needsUpdate = true;
  mesh.frustumCulled = false;

  // Top of the island's center column, in world Y — the origin anchor's own
  // standing height (kept as the default/legacy single value; background
  // islands and anything else not tied to a specific anchor still uses it
  // as a reference point).
  mesh.standingHeight = centerTopLevel * cellSize + cellSize / 2;

  // Per-anchor standing height — each anchor's clearing now flattens toward
  // its own local terrain instead of the island's global minimum (see
  // anchorTargets above), so no two anchors are guaranteed to sit at the
  // same height anymore; callers need to look theirs up by key instead of
  // assuming `standingHeight` fits everyone.
  mesh.anchorHeights = {};
  for (const [key, level] of Object.entries(anchorLevels)) {
    mesh.anchorHeights[key] = level * cellSize + cellSize / 2;
  }

  return mesh;
}

// A cheap, low-detail island for the horizon — same grass-top/dirt-bottom
// read as the real island, but built from a handful of merged primitives
// (mergeGeometries, same technique createCrystalCluster below already uses)
// instead of per-block InstancedMesh instances. These are far enough away
// that per-block detail would never actually be visible, so paying for it
// would be pure waste; what sells "there's a world of these out here" is
// silhouette and count, not fidelity.
export function createBackgroundIsland({ center, radius = 14, seed = 0 } = {}) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.9,
    metalness: 0.02,
  });
  const grassColor = new THREE.Color(0x5c9c3e);
  const dirtColor = new THREE.Color(0x6b4a30);

  const geometries = [];

  // Top: a few overlapping slabs at slightly different sizes/heights instead
  // of one flat box — an irregular silhouette reads as "island" even at a
  // distance; a single perfect box reads as a floating brick.
  const topCount = 3 + Math.floor(hash(seed, 1) * 3);
  for (let i = 0; i < topCount; i++) {
    const w = radius * (1.1 + hash(seed + i, 2) * 0.9);
    const d = radius * (1.1 + hash(seed + i, 5) * 0.9);
    const h = radius * (0.35 + hash(seed + i, 8) * 0.25);
    const ox = (hash(seed + i, 3) - 0.5) * radius * 0.9;
    const oz = (hash(seed + i, 6) - 0.5) * radius * 0.9;

    const geo = new THREE.BoxGeometry(w, h, d);
    geo.translate(ox, h / 2, oz);
    geometries.push({ geo, color: grassColor });
  }

  // Underside: a single downward cone. An earlier pass used a tall/narrow
  // cone (height 2.2x radius, 6-sided) — from a distance that read as a
  // sharp dart/spike stuck under the island rather than a tapered body, per
  // feedback. Shorter and wider (roughly as wide as the top slabs, barely
  // taller than it is wide) plus more sides reads as a stubby island bottom
  // instead of a weapon.
  const underHeight = radius * 1.1;
  const cone = new THREE.ConeGeometry(radius * 1.05, underHeight, 9);
  cone.rotateX(Math.PI);
  cone.translate(0, -underHeight / 2, 0);
  geometries.push({ geo: cone, color: dirtColor });

  for (const { geo, color } of geometries) {
    const colors = [];
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  const merged = mergeGeometries(geometries.map((g) => g.geo));
  for (const { geo } of geometries) geo.dispose();

  const mesh = new THREE.Mesh(merged, material);
  mesh.position.copy(center);
  mesh.userData.dispose = () => {
    merged.dispose();
    material.dispose();
  };
  return mesh;
}

// A handful of tall, narrow crystal-like columns clustered around a point —
// cheap set-dressing that gives a station its own silhouette (the
// "icebergs" beat) instead of empty ground with only a DOM panel over it.
export function createCrystalCluster({
  center,
  count = 14,
  spread = 20,
  minHeight = 10,
  maxHeight = 34,
  colorLow = 0x1a2230,
  colorHigh = 0xbfe6f5,
} = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.35,
    metalness: 0.1,
  });
  const low = new THREE.Color(colorLow);
  const high = new THREE.Color(colorHigh);

  const geometries = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.sin(i * 12.9) * 0.6;
    const dist = spread * (0.25 + 0.75 * Math.abs(Math.sin(i * 7.31)));
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const height = minHeight + (maxHeight - minHeight) * Math.abs(Math.sin(i * 3.71));
    const width = height * (0.14 + 0.1 * Math.abs(Math.sin(i * 5.13)));

    const geo = new THREE.ConeGeometry(width, height, 5);
    geo.translate(x, height / 2, z);
    geo.rotateY(i * 1.7);

    const colors = [];
    const pos = geo.attributes.position;
    const c = new THREE.Color();
    for (let v = 0; v < pos.count; v++) {
      const t = THREE.MathUtils.clamp((pos.getY(v) + height / 2) / height, 0, 1);
      c.copy(low).lerp(high, t);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometries.push(geo);
  }

  const merged = mergeGeometries(geometries);
  const mesh = new THREE.Mesh(merged, material);
  mesh.position.copy(center);
  group.add(mesh);
  group.userData.dispose = () => {
    merged.dispose();
    material.dispose();
  };
  return group;
}
