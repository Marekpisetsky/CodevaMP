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

// One cube "block" per grid column, height quantized to discrete levels —
// this (plus flat shading) is what reads as voxel/Minecraft terrain rather
// than a smoothly-deformed hill. A flattened clearing at the center gives
// the hero a level spot to stand on instead of a random height.
//
// `zones` lets each station claim a patch of this shared ground with its
// own palette (world-scene.js passes one per station, in world x/z units)
// — a station's arrival is meant to read as a different place, not just a
// different camera angle on the same red-black ground. Ground outside any
// zone's radius falls back to a quiet neutral tone, so the colored patches
// read as distinct islands instead of one continuous gradient.
export function createTerrain({
  gridSize = 90,
  cellSize = 3,
  maxLevels = 10,
  noiseScale = 0.045,
  clearingRadius = 14,
  zones = [],
} = {}) {
  // Flush against each other (no shrink factor) — a small per-instance gap
  // reads as a deliberate render choice ("floating voxels"), but here it
  // just showed as broken seams with nothing between them. Real terrain
  // blocks sit flush.
  const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
  // Remap the top face's V range onto the atlas's top half, every other
  // face onto the bottom half — BoxGeometry's fixed vertex layout is 4 UVs
  // per face in order [+x, -x, +y, -y, +z, -z], so face 2 (+y, top) is
  // vertices 8-11.
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

  const atlas = createTerrainAtlas();
  // Not vertexColors/setColorAt — in this three.js version that combined
  // with a `map` on an InstancedMesh silently drops the texture entirely
  // (confirmed by testing: MeshBasicMaterial/MeshStandardMaterial with
  // only `map` render it fine; adding vertexColors:true, with per-instance
  // tint coming only from instanceColor rather than a real geometry color
  // attribute, makes the map vanish — a real bug in this combination, not
  // a config mistake). A custom per-instance attribute wired through
  // onBeforeCompile sidesteps it entirely.
  const material = new THREE.MeshStandardMaterial({
    map: atlas,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.04,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'attribute vec3 aTint;\nvarying vec3 vTint;\nvoid main() {\n  vTint = aTint;');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying vec3 vTint;\nvoid main() {')
      .replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb *= vTint;');
  };

  const count = gridSize * gridSize;
  const tintArray = new Float32Array(count * 3);
  geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tintArray, 3));

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  mesh.userData.dispose = () => {
    geometry.dispose();
    atlas.dispose();
    material.dispose();
  };

  // Brighter floor than a literal "--bg-panel" match on purpose — a low
  // block that reads as near-pure-black on a wide viewport just vanishes
  // into the background, which is exactly what made the world read as a
  // narrow figure floating in empty space instead of a full wallpaper.
  const neutralLow = new THREE.Color(0x222026);
  const neutralMid = new THREE.Color(0x2a2730);
  const neutralHigh = new THREE.Color(0x3a3640);

  const preparedZones = zones.map((z) => ({
    x: z.x,
    z: z.z,
    radius: z.radius,
    low: new THREE.Color(z.colorLow),
    mid: new THREE.Color(z.colorMid),
    high: new THREE.Color(z.colorHigh),
  }));

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const zoneColor = new THREE.Color();
  const half = gridSize / 2;
  let i = 0;
  let centerHeight = 0;

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      const nx = gx - half, nz = gz - half;
      const distFromCenter = Math.sqrt(nx * nx + nz * nz);
      const worldX = nx * cellSize, worldZ = nz * cellSize;

      let n = Math.pow(fbm(nx * noiseScale, nz * noiseScale), 1.5);
      // Flatten toward 0 height around the grid origin AND around every
      // zone center, not just the origin — every station's object/camera
      // is placed using the shared `terrain.standingHeight` (the height at
      // the grid origin) as its Y baseline, so unflattened noise elsewhere
      // could put a station's own camera underneath, or its object
      // floating above, a tall random peak that has nothing to do with
      // that baseline.
      let flatten = distFromCenter < clearingRadius
        ? (distFromCenter / clearingRadius) ** 2
        : 1;
      for (const zone of zones) {
        // distFromCenter above is in grid-cell units (nx/nz), not world
        // units — zone.x/zone.z are world units, so convert before
        // comparing, or clearingRadius ends up ~3x too small here.
        const zdx = nx - zone.x / cellSize, zdz = nz - zone.z / cellSize;
        const zoneDist = Math.sqrt(zdx * zdx + zdz * zdz);
        if (zoneDist < clearingRadius) {
          flatten = Math.min(flatten, (zoneDist / clearingRadius) ** 2);
        }
      }
      n *= flatten;

      const level = Math.round(n * maxLevels);
      const y = level * cellSize;

      dummy.position.set(worldX, y, worldZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const t = THREE.MathUtils.clamp(n, 0, 1);
      color.copy(neutralLow).lerp(neutralMid, Math.min(1, t / 0.5));
      if (t >= 0.5) color.copy(neutralMid).lerp(neutralHigh, (t - 0.5) / 0.5);

      for (const zone of preparedZones) {
        const dx = worldX - zone.x, dz = worldZ - zone.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        const weight = 1 - smoothstep(zone.radius * 0.5, zone.radius * 1.5, d);
        if (weight <= 0) continue;
        if (t < 0.5) zoneColor.copy(zone.low).lerp(zone.mid, t / 0.5);
        else zoneColor.copy(zone.mid).lerp(zone.high, (t - 0.5) / 0.5);
        color.lerp(zoneColor, weight);
      }

      tintArray[i * 3] = color.r;
      tintArray[i * 3 + 1] = color.g;
      tintArray[i * 3 + 2] = color.b;

      if (distFromCenter < 0.5) centerHeight = y;
      i++;
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  geometry.attributes.aTint.needsUpdate = true;
  mesh.frustumCulled = false;

  // Top of the terrain's center column, in world Y — where the hero should
  // stand (+ half the block's own height, since instance positions are
  // block centers).
  mesh.standingHeight = centerHeight + cellSize / 2;

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

const FOG_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FOG_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv * 3.0 + vec2(uTime * 0.015, uTime * 0.008);
  float n = noise(uv) * 0.6 + noise(uv * 2.3 + 5.0) * 0.4;
  float edge = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
  float alpha = smoothstep(0.3, 0.85, n) * 0.3 * edge;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// Slow-scrolling noise-alpha plane, a few stacked at different distances —
// the "niebla que se mueve" cue, cheap compared to real volumetric fog.
export function createMovingMist({ width = 400, height = 40, color = 0x0a0a0c } = {}) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.ShaderMaterial({
    vertexShader: FOG_VERT,
    fragmentShader: FOG_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}
