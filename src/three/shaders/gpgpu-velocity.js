// Runs once per particle per frame, in parallel on the GPU (one texel =
// one particle's velocity). This is a direct GLSL port of the physics that
// used to run as a JS loop over Float32Arrays — same formulas, same
// constants — just executed per-texel instead of per-array-index, which is
// what makes 100k particles feasible at 60fps (a CPU version of this loop
// measured ~24fps at that count).
//
// Disturbance (0 = at rest, 1 = just got hit) is packed into this texture's
// alpha channel since GPUComputationRenderer variables are RGBA-only and
// there's no separate scalar texture to spare. It only ever suppresses the
// spring pulling a particle back to rest — it never adds force of its own,
// so a particle never keeps moving once its real velocity has bled off with
// nothing left to cause it.
export default /* glsl */ `
uniform sampler2D textureBasePosition;
uniform float uDt;
uniform float uTime;
uniform float uCursorActive;
uniform vec3 uCursorPos;
uniform vec3 uCursorVel;

const float SPRING_K = 26.0;
const float DAMPING = 3.2;
const float INFLUENCE_RADIUS = 7.0;
const float CARRY_GAIN = 1.3;
const float SCATTER_GAIN = 26.0;
const float SPRING_SUPPRESSION = 0.9;
const float IDLE_FORCE = 8.0;
const float DISTURB_RISE = 30.0;
const float DISTURB_DECAY = 0.9;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 velData = texture2D(textureVelocity, uv);
  vec3 vel = velData.xyz;
  float dist = velData.w;

  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 base = texture2D(textureBasePosition, uv).xyz;

  // Per-particle random phase/frequency/response/scatter-direction, derived
  // from this texel's own uv — the GPU equivalent of the precomputed hash
  // arrays the CPU version built once at init.
  float pid = uv.x * 9973.0 + uv.y * 6151.0;
  float phaseX = hash11(pid * 1.61803) * 6.2831853;
  float phaseY = hash11(pid * 7.23606 + 11.1) * 6.2831853;
  float phaseZ = hash11(pid * 3.14159 + 91.7) * 6.2831853;
  float freqX = 1.1 + hash11(pid * 2.71828) * 2.6;
  float freqY = 1.1 + hash11(pid * 5.43656 + 3.3) * 2.6;
  float freqZ = 1.1 + hash11(pid * 9.8696 + 7.7) * 2.6;
  float variance = 0.5 + hash11(pid * 4.6692) * 0.9;
  vec3 scatterDir = vec3(
    hash11(pid * 8.32 + 1.0) * 2.0 - 1.0,
    hash11(pid * 3.71 + 5.5) * 2.0 - 1.0,
    hash11(pid * 6.28 + 9.9) * 2.0 - 1.0
  );

  float contactScale = 1.0;

  if (uCursorActive > 0.5) {
    vec3 d = pos - uCursorPos;
    float d2 = dot(d, d);
    float r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
    if (d2 < r2) {
      float falloff = 1.0 - sqrt(d2) / INFLUENCE_RADIUS;
      contactScale = 1.0 - falloff * SPRING_SUPPRESSION * min(1.0, variance);

      float kick = falloff * variance * uDt;
      vel += (uCursorVel * CARRY_GAIN + scatterDir * SCATTER_GAIN) * kick;

      dist = min(1.0, dist + DISTURB_RISE * falloff * uDt);
    }
  }

  float springScale = contactScale * (1.0 - dist * 0.7);
  vec3 accel = (base - pos) * SPRING_K * springScale;

  accel.x += sin(uTime * freqX + phaseX) * IDLE_FORCE;
  accel.y += sin(uTime * freqY + phaseY) * IDLE_FORCE;
  accel.z += sin(uTime * freqZ + phaseZ) * IDLE_FORCE;

  vel = (vel + accel * uDt) * exp(-DAMPING * uDt);
  dist = dist * exp(-DISTURB_DECAY * uDt);

  gl_FragColor = vec4(vel, dist);
}
`;
