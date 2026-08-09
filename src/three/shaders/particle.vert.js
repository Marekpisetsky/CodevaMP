export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform vec3 uCursor;
uniform float uRadius;
uniform float uStrength;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uFlowStrength;
uniform float uPushDistance;

varying vec3 vColor;
varying float vShimmer;

// A restless, per-particle wobble: mostly driven by each particle's own seed
// (so neighbors are out of phase with each other, not moving in lockstep),
// with a little position dependency for a faint shared current. Amplitude is
// deliberately small — this is meant to read as "the surface won't sit
// still," not as particles drifting away from the shape.
vec3 flow(vec3 p, float t, float seed) {
  float x = sin(t * 2.2 + seed * 41.7) + 0.4 * sin(p.y * 0.6 + t * 0.9 + seed * 6.28);
  float y = sin(t * 2.0 + seed * 17.3) + 0.4 * sin(p.z * 0.6 + t * 0.8 + seed * 3.14);
  float z = sin(t * 2.4 + seed * 63.1) + 0.4 * sin(p.x * 0.6 + t * 1.0 + seed * 5.02);
  return vec3(x, y, z);
}

void main() {
  vec3 pos = position + flow(position, uTime, aSeed) * uFlowStrength;

  float d = distance(pos, uCursor);
  float falloff = smoothstep(uRadius, 0.0, d);
  vec3 dir = normalize(pos - uCursor + 1e-4);
  pos += dir * falloff * uStrength * uPushDistance * (0.6 + 0.4 * aSeed);

  float shimmer = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointSize * uPixelRatio * (0.7 + 0.6 * shimmer) * (0.75 + 0.5 * aSeed);
}
`;
