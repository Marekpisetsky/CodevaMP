// Per-particle physics on the CPU, over plain typed arrays — no GPU
// compute, no per-particle JS objects, one function call per frame. This
// scales down cleanly to weak/old mobile GPUs in a way GPU-texture physics
// doesn't: vertex texture fetches (what a GPUComputationRenderer approach
// needs in the render shader) are notoriously slow on older mobile GPUs,
// so the count/complexity knobs here (see device-quality.js) are what keep
// this loop inside the frame budget on any device.
//
// Every particle has: targetPosition (basePositions, immutable), a
// currentPosition + velocity (positions/velocities, mutated in place), and
// an `activity` level (0 = fully at rest, 1 = just got hit). Activity is
// the actual perf lever this file exists to use: a particle only ever gets
// activated by proximity to the pointer (the only trigger this codebase
// has — there's no separate shockwave/explosion pulse mechanic, "pointer
// radius" is it). Once active, it decays on its own afterward, and only
// ever SUPPRESSES the spring pulling it back to rest — it never adds force
// itself. The moment a particle is both out of pointer range AND its
// activity has decayed under ACTIVITY_THRESHOLD, it skips the spring/idle-
// wobble/damping/integration math completely: position is snapped exactly
// to target, velocity to zero, and it's left alone until reactivated. On a
// typical frame only a small fraction of particles are within pointer
// range or still settling from a recent hit, so skipping the expensive
// part (three sin() calls plus the spring/damping arithmetic) for
// everything else is the difference this makes — the cheap distance check
// itself still has to run for every particle every frame (finding "is
// anything near the cursor" without it needs a spatial index, which is a
// separate, bigger change from what was asked here).
const SPRING_K = 26;
const DAMPING = 3.2;
const CARRY_GAIN = 1.3;
const SCATTER_GAIN = 26;
const SCATTER_SPEED_REF = 6; // cursor speed (units/s) at which scatter reaches full strength
const SPRING_SUPPRESSION = 0.9;
const IDLE_FORCE = 8; // ambient wobble while active; rest particles get none (see file header)
const ACTIVITY_RISE = 30;
const ACTIVITY_DECAY = 0.9;
const ACTIVITY_THRESHOLD = 0.02;
const MAX_DISPLACEMENT = 24; // safety cap: nothing should be able to drift farther than this from its target, ever

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
  const positions = new Float32Array(basePositions); // currentPosition, mutable, what actually gets rendered
  const velocities = new Float32Array(count * 3);
  const activity = new Float32Array(count); // 0..1, see file header

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
    const activityDecay = Math.exp(-ACTIVITY_DECAY * dt);
    const cursorSpeed = cursor
      ? Math.sqrt(cursor.vx * cursor.vx + cursor.vy * cursor.vy + cursor.vz * cursor.vz)
      : 0;

    for (let i = 0; i < count; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      const px = positions[ix], py = positions[iy], pz = positions[iz];

      // Cheap check every particle needs regardless of its current state:
      // is the pointer close enough to (re)activate it this frame?
      let nearCursor = false;
      let falloff = 0;
      if (cursor) {
        const dx = px - cursor.x, dy = py - cursor.y, dz = pz - cursor.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2) {
          nearCursor = true;
          falloff = 1 - Math.sqrt(d2) / interactionRadius;
        }
      }

      let act = activity[i];

      // Fast path: not being touched and already settled — skip the spring,
      // idle wobble and integration entirely, just pin it down.
      if (!nearCursor && act < ACTIVITY_THRESHOLD) {
        if (act !== 0 || px !== basePositions[ix] || py !== basePositions[iy] || pz !== basePositions[iz]) {
          positions[ix] = basePositions[ix];
          positions[iy] = basePositions[iy];
          positions[iz] = basePositions[iz];
          velocities[ix] = 0;
          velocities[iy] = 0;
          velocities[iz] = 0;
          activity[i] = 0;
        }
        continue;
      }

      // Active path: near the pointer, or still settling from a recent hit.
      const variance = responseVariance[i];
      let vx = velocities[ix], vy = velocities[iy], vz = velocities[iz];
      let contactScale = 1;

      if (nearCursor) {
        contactScale = 1 - falloff * SPRING_SUPPRESSION * Math.min(1, variance);

        // Scatter is a "got swatted" kick, not an ambient field — it has to
        // scale with how fast the cursor is actually moving (same idea as
        // CARRY_GAIN, which already does this naturally since cursor.vx/vy/vz
        // are 0 for a motionless cursor). Without this, a cursor that's
        // merely resting near the figure (not moving, e.g. the user reading
        // something with the mouse left in place) kept injecting this every
        // single frame regardless — with the spring simultaneously
        // suppressed by proximity, that drifted particles steadily outward
        // with nothing pulling them back for as long as the cursor sat
        // still, instead of a stationary cursor having ~no effect.
        const speedFactor = Math.min(1, cursorSpeed / SCATTER_SPEED_REF);
        const kick = falloff * variance * dt;
        vx += (cursor.vx * CARRY_GAIN + scatterDir[ix] * SCATTER_GAIN * speedFactor) * kick;
        vy += (cursor.vy * CARRY_GAIN + scatterDir[iy] * SCATTER_GAIN * speedFactor) * kick;
        vz += (cursor.vz * CARRY_GAIN + scatterDir[iz] * SCATTER_GAIN * speedFactor) * kick;

        act = Math.min(1, act + ACTIVITY_RISE * falloff * dt);
      }

      const springScale = contactScale * (1 - act * 0.7);
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

      let nx = px + vx * dt;
      let ny = py + vy * dt;
      let nz = pz + vz * dt;

      // Safety net independent of the scatter fix above: nothing should
      // ever be able to drift further than this from its target, whatever
      // combination of forces caused it — clamp back onto the sphere of
      // radius MAX_DISPLACEMENT around basePositions instead of silently
      // trusting every force term to always be well-behaved.
      const ox = nx - basePositions[ix], oy = ny - basePositions[iy], oz = nz - basePositions[iz];
      const distSq = ox * ox + oy * oy + oz * oz;
      if (distSq > MAX_DISPLACEMENT * MAX_DISPLACEMENT) {
        const scale = MAX_DISPLACEMENT / Math.sqrt(distSq);
        nx = basePositions[ix] + ox * scale;
        ny = basePositions[iy] + oy * scale;
        nz = basePositions[iz] + oz * scale;
      }

      velocities[ix] = vx;
      velocities[iy] = vy;
      velocities[iz] = vz;

      positions[ix] = nx;
      positions[iy] = ny;
      positions[iz] = nz;

      activity[i] = act * activityDecay;
    }
  }

  return { positions, update };
}
