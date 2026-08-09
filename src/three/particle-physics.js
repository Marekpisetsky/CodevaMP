// A real (if cheap) per-particle physics sim: each point has its own velocity
// and gets pulled back toward its rest position by a damped spring, instead
// of the position being a formula re-evaluated from scratch every frame.
// That's what makes a cursor hit read as inertia + an organic, independent
// return per particle, rather than every particle retracting in lockstep
// along the same line the instant the cursor moves away.
const SPRING_K = 46;       // pull-back strength toward the rest shape
const DAMPING = 5.4;       // velocity drag (exponential per second) — underdamped on purpose for a little spring "bounce"
const REPEL_RADIUS = 12;
const REPEL_STRENGTH = 850; // outward push at the center of the radius
const IDLE_FORCE = 9;      // small continuous per-particle jitter so it's never perfectly still at rest

export function createParticlePhysics({ basePositions, count }) {
  const positions = new Float32Array(basePositions); // mutable, what actually gets rendered
  const velocities = new Float32Array(count * 3);

  function update(dt, cursor, time) {
    if (dt <= 0) return;
    const r2 = REPEL_RADIUS * REPEL_RADIUS;
    const damp = Math.exp(-DAMPING * dt);

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const px = positions[ix], py = positions[iy], pz = positions[iz];

      let ax = (basePositions[ix] - px) * SPRING_K;
      let ay = (basePositions[iy] - py) * SPRING_K;
      let az = (basePositions[iz] - pz) * SPRING_K;

      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, dz = pz - cursor.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / REPEL_RADIUS;
          const mag = (REPEL_STRENGTH * falloff * falloff * (1 + cursor.speed * 0.6)) / d;
          ax += dx * mag;
          ay += dy * mag;
          az += dz * mag;
        }
      }

      const seed = i * 12.9898;
      ax += Math.sin(time * 1.7 + seed) * IDLE_FORCE;
      ay += Math.sin(time * 1.5 + seed * 1.3) * IDLE_FORCE;
      az += Math.sin(time * 1.9 + seed * 0.7) * IDLE_FORCE;

      let vx = (velocities[ix] + ax * dt) * damp;
      let vy = (velocities[iy] + ay * dt) * damp;
      let vz = (velocities[iz] + az * dt) * damp;

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
