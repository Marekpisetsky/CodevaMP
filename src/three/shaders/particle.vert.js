export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform vec3 uCursor;
uniform float uRadius;
uniform float uStrength;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uFlowStrength;

varying vec3 vColor;
varying float vShimmer;

// A cheap flow field: three phase-shifted sine waves per axis, driven by the
// particle's own position (so neighbors move together, reading as a drifting
// current) plus its seed (so it's not perfectly synchronized). This is what
// makes the cloud feel like something is continuously moving it, even with
// no cursor nearby — not just a rigid shape spinning in place.
vec3 flow(vec3 p, float t, float seed) {
  float x = sin(p.y * 0.16 + t * 0.6 + seed * 6.2831853)
          + sin(p.z * 0.11 - t * 0.42 + seed * 3.14159);
  float y = sin(p.z * 0.14 + t * 0.5 + seed * 2.09439)
          + sin(p.x * 0.10 - t * 0.33 + seed * 5.02655);
  float z = sin(p.x * 0.15 + t * 0.46 + seed * 1.67552)
          + sin(p.y * 0.12 - t * 0.28 + seed * 4.18879);
  return vec3(x, y, z);
}

void main() {
  vec3 pos = position + flow(position, uTime, aSeed) * uFlowStrength;

  float d = distance(pos, uCursor);
  float falloff = smoothstep(uRadius, 0.0, d);
  vec3 dir = normalize(pos - uCursor + 1e-4);
  pos += dir * falloff * uStrength * (0.6 + 0.4 * aSeed);

  float shimmer = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointSize * uPixelRatio * (0.7 + 0.6 * shimmer) * (0.75 + 0.5 * aSeed);
}
`;
