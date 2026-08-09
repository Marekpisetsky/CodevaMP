export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform vec3 uCursor;
uniform float uRadius;
uniform float uStrength;
uniform float uPointSize;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vShimmer;

// Cheap hash-based jitter so the cloud doesn't read as a rigid pixel grid.
vec3 jitter3(float seed) {
  float a = fract(sin(seed * 12.9898) * 43758.5453);
  float b = fract(sin(seed * 78.233) * 12345.678);
  float c = fract(sin(seed * 39.346) * 98765.432);
  return (vec3(a, b, c) - 0.5) * 0.7;
}

void main() {
  vec3 pos = position + jitter3(aSeed);

  float d = distance(pos, uCursor);
  float falloff = smoothstep(uRadius, 0.0, d);
  vec3 dir = normalize(pos - uCursor + 1e-4);
  pos += dir * falloff * uStrength * (0.6 + 0.4 * aSeed);

  float shimmer = 0.5 + 0.5 * sin(uTime * 1.6 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointSize * uPixelRatio * (0.8 + 0.4 * shimmer);
}
`;
