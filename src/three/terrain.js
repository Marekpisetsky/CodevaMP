import * as THREE from 'three';

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

// One cube "block" per grid column, height quantized to discrete levels —
// this (plus flat shading) is what reads as voxel/Minecraft terrain rather
// than a smoothly-deformed hill. A flattened clearing at the center gives
// the hero a level spot to stand on instead of a random height.
export function createTerrain({
  gridSize = 90,
  cellSize = 3,
  maxLevels = 16,
  noiseScale = 0.045,
  clearingRadius = 6,
} = {}) {
  const geometry = new THREE.BoxGeometry(cellSize * 0.96, cellSize, cellSize * 0.96);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.92,
    metalness: 0.04,
  });

  const count = gridSize * gridSize;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  // Brighter floor than a literal "--bg-panel" match on purpose — a low
  // block that reads as near-pure-black on a wide viewport just vanishes
  // into the background, which is exactly what made the world read as a
  // narrow figure floating in empty space instead of a full wallpaper.
  const colorLow = new THREE.Color(0x232228);
  const colorMid = new THREE.Color(0x4a1814); // dark red blend
  const colorHigh = new THREE.Color(0xe8342a); // --red, ridge highlight

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const half = gridSize / 2;
  let i = 0;
  let centerHeight = 0;

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      const nx = gx - half, nz = gz - half;
      const distFromCenter = Math.sqrt(nx * nx + nz * nz);

      let n = Math.pow(fbm(nx * noiseScale, nz * noiseScale), 1.7); // bias toward low ground, occasional peaks
      if (distFromCenter < clearingRadius) {
        const t = distFromCenter / clearingRadius;
        n *= t * t; // flatten toward 0 height right at the center
      }

      const level = Math.round(n * maxLevels);
      const y = level * cellSize;

      dummy.position.set(nx * cellSize, y, nz * cellSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const t = THREE.MathUtils.clamp(n, 0, 1);
      if (t < 0.5) color.copy(colorLow).lerp(colorMid, t / 0.5);
      else color.copy(colorMid).lerp(colorHigh, (t - 0.5) / 0.5);
      mesh.setColorAt(i, color);

      if (distFromCenter < 0.5) centerHeight = y;
      i++;
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;

  // Top of the terrain's center column, in world Y — where the hero should
  // stand (+ half the block's own height, since instance positions are
  // block centers).
  mesh.standingHeight = centerHeight + cellSize / 2;

  return mesh;
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
