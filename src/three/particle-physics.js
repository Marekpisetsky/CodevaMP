// Per-particle physics on the CPU, over plain typed arrays — no GPU
// compute, no per-particle JS objects, one function call per frame. This
// scales down cleanly to weak/old mobile GPUs in a way GPU-texture physics
// doesn't: vertex texture fetches (what a GPUComputationRenderer approach
// needs in the render shader) are notoriously slow on older mobile GPUs,
// so the count/complexity knobs here are what device-quality.js uses to
// keep this loop inside the frame budget on any device, instead of relying
// on compute-shader throughput that may not be there.
//
// Every particle carries a "disturbance" level (0 = at rest, 1 = just got
// hit):
// - On contact, a particle gets kicked by an IMPULSE (added to its
//   velocity, not a target it's forced toward) that mixes the cursor's own
//   velocity (carry) with a fixed-per-particle random scatter direction —
//   so a touch doesn't move every affected particle the same way, closer
//   to knocking a handful of debris than dragging one shape.
// - Disturbance spikes on contact and decays on its own afterward, and
//   only ever SUPPRESSES the spring pulling a particle back to rest — it
//   never adds force. A freshly-hit particle keeps moving purely on the
//   velocity it was actually given (real inertia, bled off by damping),
//   reeled back in gradually as disturbance fades — it must not keep
//   animating once its velocity has died down just because disturbance
//   hasn't; that would be motion with no force behind it.
const SPRING_K = 26;
const DAMPING = 3.2;
const CARRY_GAIN = 1.3;
const SCATTER_GAIN = 26;
const SPRING_SUPPRESSION = 0.9;
const IDLE_FORCE = 8; // small ambient wobble, constant whether disturbed or not
const DISTURB_RISE = 30;
const DISTURB_DECAY = 0.9;

// sin(i * constant) alone is NOT per-particle randomness (see this file's
// git history) — this hash properly decorrelates each particle.
function hash(n) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

export function createParticlePhysics({
  basePositions,
  count,
  interactionRadius = 7,
  noiseComplexity = 1, // 0..1 — veryLow tier sets this to 0 to skip idle-wobble sin() calls entirely
}) {
  const positions = new Float32Array(basePositions); // mutable, what actually gets rendered
  const velocities = new Float32Array(count * 3);
  const disturbance = new Float32Array(count);

  const idlePhase = new Float32Array(count * 3);
  const idleFreq = new Float32Array(count * 3);
  const responseVariance = new Float32Array(count);
  const scatterDir = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const ix = i * 3, iy = ix + 1, iz = ix + 2;
    idlePhase[ix] = hash(i * 1.61803) * Math.PI * 2;
    idlePhase[iy] = hash(i * 7.23606 + 11.1) * Math.PI * 2;
    idlePhase[iz] = hash(i * 3.14159 + 91.7) * Math.PI * 2;
    idleFreq[ix] = 1.1 + hash(i * 2.71828) * 2.6;
    idleFreq[iy] = 1.1 + hash(i * 5.43656 + 3.3) * 2.6;
    idleFreq[iz] = 1.1 + hash(i * 9.8696 + 7.7) * 2.6;
    responseVariance[i] = 0.5 + hash(i * 4.6692) * 0.9; // 0.5..1.4
    scatterDir[ix] = hash(i * 8.32 + 1.0) * 2 - 1;
    scatterDir[iy] = hash(i * 3.71 + 5.5) * 2 - 1;
    scatterDir[iz] = hash(i * 6.28 + 9.9) * 2 - 1;
  }

  const idleForce = IDLE_FORCE * noiseComplexity;
  const runIdle = noiseComplexity > 0;
  const r2 = interactionRadius * interactionRadius;

  function update(dt, cursor, time) {
    if (dt <= 0) return;
    const damp = Math.exp(-DAMPING * dt);
    const disturbDecay = Math.exp(-DISTURB_DECAY * dt);

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const px = positions[ix], py = positions[iy], pz = positions[iz];
      const variance = responseVariance[i];

      let vx = velocities[ix], vy = velocities[iy], vz = velocities[iz];
      let dist = disturbance[i];
      let contactScale = 1;

      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, dz = pz - cursor.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2) {
          const falloff = 1 - Math.sqrt(d2) / interactionRadius;
          contactScale = 1 - falloff * SPRING_SUPPRESSION * Math.min(1, variance);

          const kick = falloff * variance * dt;
          vx += (cursor.vx * CARRY_GAIN + scatterDir[ix] * SCATTER_GAIN) * kick;
          vy += (cursor.vy * CARRY_GAIN + scatterDir[iy] * SCATTER_GAIN) * kick;
          vz += (cursor.vz * CARRY_GAIN + scatterDir[iz] * SCATTER_GAIN) * kick;

          dist = Math.min(1, dist + DISTURB_RISE * falloff * dt);
        }
      }

      const springScale = contactScale * (1 - dist * 0.7);
      let ax = (basePositions[ix] - px) * SPRING_K * springScale;
      let ay = (basePositions[iy] - py) * SPRING_K * springScale;
      let az = (basePositions[iz] - pz) * SPRING_K * springScale;

      if (runIdle) {
        ax += Math.sin(time * idleFreq[ix] + idlePhase[ix]) * idleForce;
        ay += Math.sin(time * idleFreq[iy] + idlePhase[iy]) * idleForce;
        az += Math.sin(time * idleFreq[iz] + idlePhase[iz]) * idleForce;
      }

      vx = (vx + ax * dt) * damp;
      vy = (vy + ay * dt) * damp;
      vz = (vz + az * dt) * damp;

      velocities[ix] = vx;
      velocities[iy] = vy;
      velocities[iz] = vz;

      positions[ix] = px + vx * dt;
      positions[iy] = py + vy * dt;
      positions[iz] = pz + vz * dt;

      disturbance[i] = dist * disturbDecay;
    }
  }

  return { positions, update };
}
