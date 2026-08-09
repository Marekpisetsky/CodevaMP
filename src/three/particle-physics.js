// Real per-particle physics: each point has its own velocity, integrated
// every frame, instead of position being a formula re-evaluated from
// scratch. See cursor-interaction.js for why the cursor drives this with a
// velocity vector (carry/advection) rather than a push-away-from-position
// field.
const SPRING_K = 40;
const DAMPING = 4.0;
const INFLUENCE_RADIUS = 13;
const CARRY_RATE = 14;
const CARRY_GAIN = 1.05;
const SPRING_SUPPRESSION = 0.92;
const IDLE_FORCE = 14;

// sin(i * constant) is NOT per-particle randomness — for consecutive integer
// i it's a smoothly precessing phase, and consecutive particles are also
// spatially clustered (the skin parser emits samples face-by-face), so that
// combination produced a coherent wave sweeping across the cloud instead of
// independent jitter: exactly what read as "viscous" and as the rotation
// "reversing direction" (a real illusion, not an actual sign flip anywhere).
// This hash properly decorrelates each particle's phase and frequency.
function hash(n) {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

export function createParticlePhysics({ basePositions, count }) {
  const positions = new Float32Array(basePositions); // mutable, what actually gets rendered
  const velocities = new Float32Array(count * 3);

  const idlePhase = new Float32Array(count * 3);
  const idleFreq = new Float32Array(count * 3);
  const responseVariance = new Float32Array(count); // water droplets don't all react identically

  for (let i = 0; i < count; i++) {
    const ix = i * 3, iy = ix + 1, iz = ix + 2;
    idlePhase[ix] = hash(i * 1.61803) * Math.PI * 2;
    idlePhase[iy] = hash(i * 7.23606 + 11.1) * Math.PI * 2;
    idlePhase[iz] = hash(i * 3.14159 + 91.7) * Math.PI * 2;
    idleFreq[ix] = 1.1 + hash(i * 2.71828) * 2.6;
    idleFreq[iy] = 1.1 + hash(i * 5.43656 + 3.3) * 2.6;
    idleFreq[iz] = 1.1 + hash(i * 9.8696 + 7.7) * 2.6;
    responseVariance[i] = 0.5 + hash(i * 4.6692) * 0.9; // 0.5..1.4
  }

  function update(dt, cursor, time) {
    if (dt <= 0) return;
    const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
    const damp = Math.exp(-DAMPING * dt);

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const px = positions[ix], py = positions[iy], pz = positions[iz];
      const variance = responseVariance[i];

      let vx = velocities[ix], vy = velocities[iy], vz = velocities[iz];
      let springScale = 1;

      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, dz = pz - cursor.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2) {
          const falloff = 1 - Math.sqrt(d2) / INFLUENCE_RADIUS;
          springScale = 1 - falloff * SPRING_SUPPRESSION * Math.min(1, variance);

          const blend = Math.min(1, CARRY_RATE * falloff * dt * variance);
          vx += (cursor.vx * CARRY_GAIN - vx) * blend;
          vy += (cursor.vy * CARRY_GAIN - vy) * blend;
          vz += (cursor.vz * CARRY_GAIN - vz) * blend;
        }
      }

      let ax = (basePositions[ix] - px) * SPRING_K * springScale;
      let ay = (basePositions[iy] - py) * SPRING_K * springScale;
      let az = (basePositions[iz] - pz) * SPRING_K * springScale;

      ax += Math.sin(time * idleFreq[ix] + idlePhase[ix]) * IDLE_FORCE;
      ay += Math.sin(time * idleFreq[iy] + idlePhase[iy]) * IDLE_FORCE;
      az += Math.sin(time * idleFreq[iz] + idlePhase[iz]) * IDLE_FORCE;

      vx = (vx + ax * dt) * damp;
      vy = (vy + ay * dt) * damp;
      vz = (vz + az * dt) * damp;

      velocities[ix] = vx;
      velocities[iy] = vy;
      velocities[iz] = vz;

      positions[ix] = px + vx * dt;
      positions[iy] = py + vy * dt;
      positions[iz] = pz + vz * dt;
    }
  }

  return { positions, update };
}
