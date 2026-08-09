// Real per-particle physics: each point has its own velocity, integrated
// every frame, instead of position being a formula re-evaluated from
// scratch. Two things make this read as Newtonian rather than "fighting to
// snap back":
//
// 1. Cursor influence is an advection/carry field, not a push-away field —
//    nearby particles' velocities blend toward the CURSOR'S velocity vector.
//    A slow drag keeps blending them toward its (slow) velocity every frame,
//    so they visibly get carried along and pick up real momentum. A fast
//    swipe only overlaps a particle for a frame or two, so the blend only
//    partially completes — a brief "dash" kick — before the cursor is gone
//    and the particle continues on that inherited velocity by itself.
// 2. The spring pulling particles back to rest is locally suppressed near
//    the cursor, so the carry isn't fighting a constant pull-back while
//    it's happening — the spring only takes back over once a particle is
//    actually left alone, which is what makes the return read as settling
//    under momentum instead of a tug-of-war.
const SPRING_K = 40;
const DAMPING = 4.0;
const INFLUENCE_RADIUS = 13;
const CARRY_RATE = 14;          // how fast a nearby particle's velocity locks onto the cursor's
const CARRY_GAIN = 1.05;        // cursor velocity -> particle velocity transfer
const SPRING_SUPPRESSION = 0.92; // how much the spring is muted right at the cursor (of 1 = fully)
const IDLE_FORCE = 9;           // small continuous per-particle jitter so it's never perfectly still

export function createParticlePhysics({ basePositions, count }) {
  const positions = new Float32Array(basePositions); // mutable, what actually gets rendered
  const velocities = new Float32Array(count * 3);

  function update(dt, cursor, time) {
    if (dt <= 0) return;
    const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
    const damp = Math.exp(-DAMPING * dt);

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const px = positions[ix], py = positions[iy], pz = positions[iz];

      let vx = velocities[ix], vy = velocities[iy], vz = velocities[iz];
      let springScale = 1;

      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, dz = pz - cursor.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2) {
          const falloff = 1 - Math.sqrt(d2) / INFLUENCE_RADIUS; // 0..1, 1 = right at the cursor
          springScale = 1 - falloff * SPRING_SUPPRESSION;

          const blend = Math.min(1, CARRY_RATE * falloff * dt);
          vx += (cursor.vx * CARRY_GAIN - vx) * blend;
          vy += (cursor.vy * CARRY_GAIN - vy) * blend;
          vz += (cursor.vz * CARRY_GAIN - vz) * blend;
        }
      }

      let ax = (basePositions[ix] - px) * SPRING_K * springScale;
      let ay = (basePositions[iy] - py) * SPRING_K * springScale;
      let az = (basePositions[iz] - pz) * SPRING_K * springScale;

      const seed = i * 12.9898;
      ax += Math.sin(time * 1.7 + seed) * IDLE_FORCE;
      ay += Math.sin(time * 1.5 + seed * 1.3) * IDLE_FORCE;
      az += Math.sin(time * 1.9 + seed * 0.7) * IDLE_FORCE;

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
