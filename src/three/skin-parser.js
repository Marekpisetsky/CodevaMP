// Standard Minecraft 64x64 skin UV layout. Each body part is a box unwrapped
// onto the texture at a fixed (u, v) origin — see faceRects() for the exact
// unwrap formula, which is the same for every box regardless of size.
// armL/legL mirror armR/legR when the modern (1.8+) left-side regions are
// fully transparent, which is how legacy skins without that data behave.
export const PARTS = [
  { name: 'head',  u: 0,  v: 0,  w: 8, h: 8,  d: 8, cx: 0,  cy: 28, cz: 0 },
  { name: 'torso', u: 16, v: 16, w: 8, h: 12, d: 4, cx: 0,  cy: 18, cz: 0 },
  { name: 'armR',  u: 40, v: 16, w: 4, h: 12, d: 4, cx: -6, cy: 18, cz: 0 },
  { name: 'legR',  u: 0,  v: 16, w: 4, h: 12, d: 4, cx: -2, cy: 6,  cz: 0 },
  { name: 'armL',  u: 32, v: 48, w: 4, h: 12, d: 4, cx: 6,  cy: 18, cz: 0, mirrorOf: 'armR' },
  { name: 'legL',  u: 16, v: 48, w: 4, h: 12, d: 4, cx: 2,  cy: 6,  cz: 0, mirrorOf: 'legR' },
];

export const FIGURE_HEIGHT = 32;
export const FIGURE_CENTER_Y = 16;

export function faceRects(u, v, w, h, d) {
  return {
    top:    { u: u + d,       v,         w, h: d },
    bottom: { u: u + d + w,   v,         w, h: d },
    right:  { u,               v: v + d, w: d, h },
    front:  { u: u + d,       v: v + d, w, h },
    left:   { u: u + d + w,   v: v + d, w: d, h },
    back:   { u: u + 2 * d + w, v: v + d, w, h },
  };
}

function regionHasOpaquePixel(data, imgW, rect) {
  for (let y = rect.v; y < rect.v + rect.h; y++) {
    for (let x = rect.u; x < rect.u + rect.w; x++) {
      if (data[(y * imgW + x) * 4 + 3] > 0) return true;
    }
  }
  return false;
}

function countOpaquePixels(data, imgW, rect) {
  let n = 0;
  for (let y = rect.v; y < rect.v + rect.h; y++) {
    for (let x = rect.u; x < rect.u + rect.w; x++) {
      if (data[(y * imgW + x) * 4 + 3] > 0) n++;
    }
  }
  return n;
}

// Outward normal per face, used to "puff" samples off the surface so the
// cloud reads as a volume with real thickness instead of a flat paper shell.
const FACE_NORMALS = {
  front:  [0, 0, 1],
  back:   [0, 0, -1],
  right:  [1, 0, 0],
  left:   [-1, 0, 0],
  top:    [0, 1, 0],
  bottom: [0, -1, 0],
};

function sampleFace(data, imgW, rect, box, face, samplesPerTexel, out) {
  const hw = box.w / 2, hh = box.h / 2, hd = box.d / 2;
  const [nx, ny, nz] = FACE_NORMALS[face];

  for (let dv = 0; dv < rect.h; dv++) {
    for (let du = 0; du < rect.w; du++) {
      const idx = ((rect.v + dv) * imgW + (rect.u + du)) * 4;
      const a = data[idx + 3];
      if (a === 0) continue;

      const r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;

      for (let s = 0; s < samplesPerTexel; s++) {
        // Sub-texel jitter (smooths out the pixel grid) + an outward puff
        // along the face normal (mostly positive, adds volume/fluffiness).
        const jdu = du + (Math.random() - 0.5);
        const jdv = dv + (Math.random() - 0.5);
        const puff = Math.random() * 0.12;

        let x, y, z;
        switch (face) {
          case 'front':  x = box.cx + hw - jdu; y = box.cy + hh - jdv; z = box.cz + hd; break;
          case 'back':   x = box.cx - hw + jdu; y = box.cy + hh - jdv; z = box.cz - hd; break;
          case 'right':  x = box.cx + hw;       y = box.cy + hh - jdv; z = box.cz - hd + jdu; break;
          case 'left':   x = box.cx - hw;       y = box.cy + hh - jdv; z = box.cz + hd - jdu; break;
          case 'top':    x = box.cx + hw - jdu; y = box.cy + hh;       z = box.cz - hd + jdv; break;
          default:       x = box.cx + hw - jdu; y = box.cy - hh;      z = box.cz + hd - jdv; break; // bottom
        }
        x += nx * puff;
        y += ny * puff;
        z += nz * puff;

        out.positions.push(x, y, z);
        out.colors.push(r, g, b);
        out.normals.push(nx, ny, nz);
      }
    }
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function resolveRegions(data, size) {
  const regions = [];
  for (const part of PARTS) {
    let source = part;
    if (part.mirrorOf) {
      const rects = faceRects(part.u, part.v, part.w, part.h, part.d);
      const hasData = Object.values(rects).some((r) => regionHasOpaquePixel(data, size, r));
      if (!hasData) {
        source = PARTS.find((p) => p.name === part.mirrorOf);
      }
    }
    const rects = faceRects(source.u, source.v, source.w, source.h, source.d);
    const box = { w: part.w, h: part.h, d: part.d, cx: part.cx, cy: part.cy, cz: part.cz };
    for (const face of Object.keys(rects)) {
      regions.push({ rect: rects[face], box, face });
    }
  }
  return regions;
}

// For the rigid-block hero (hero-blocks.js): one entry per body part with
// its box dimensions/position and its 6 face UV rects already resolved for
// the legacy-vs-modern arm/leg mirroring — same resolution logic
// parseSkin() uses via resolveRegions(), just grouped by part instead of
// flattened to one entry per face.
export async function resolvePartRegions(url) {
  const img = await loadImage(url);
  const size = img.width;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  return PARTS.map((part) => {
    let source = part;
    if (part.mirrorOf) {
      const rects = faceRects(part.u, part.v, part.w, part.h, part.d);
      const hasData = Object.values(rects).some((r) => regionHasOpaquePixel(data, size, r));
      if (!hasData) source = PARTS.find((p) => p.name === part.mirrorOf);
    }
    return {
      name: part.name,
      box: { w: part.w, h: part.h, d: part.d, cx: part.cx, cy: part.cy, cz: part.cz },
      rects: faceRects(source.u, source.v, source.w, source.h, source.d),
    };
  });
}

// `targetCount` is a budget, not an exact result: samples-per-texel has to
// be a whole number, so the actual count is opaqueTexels * round(targetCount
// / opaqueTexels) — close to the ask, exact for whatever skin is loaded
// rather than tuned to this one specific file's opaque-pixel count.
export async function parseSkin(url, { targetCount = 30000 } = {}) {
  const img = await loadImage(url);
  const size = img.width; // 64 for a standard skin

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const regions = resolveRegions(data, size);

  let opaqueTexels = 0;
  for (const { rect } of regions) opaqueTexels += countOpaquePixels(data, size, rect);
  const samplesPerTexel = Math.max(1, Math.round(targetCount / Math.max(1, opaqueTexels)));

  const out = { positions: [], colors: [], normals: [] };
  for (const { rect, box, face } of regions) {
    sampleFace(data, size, rect, box, face, samplesPerTexel, out);
  }

  const count = out.positions.length / 3;
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = Math.random();

  return {
    positions: new Float32Array(out.positions),
    colors: new Float32Array(out.colors),
    normals: new Float32Array(out.normals),
    seeds,
    count,
  };
}
