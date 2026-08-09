export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vShimmer;
varying float vDepth;

void main() {
  float shimmer = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Orthographic projection alone gives no size-by-distance cue, so a
  // rotating additive-blended cloud with no lighting reads as ambiguous —
  // like the classic silhouette-spinning illusion, direction is genuinely
  // hard to tell apart from its mirror. Faking depth here (nearer = bigger
  // and brighter) gives the eye something real to resolve rotation with.
  float depthFactor = smoothstep(-7.0, 7.0, mvPosition.z);
  vDepth = depthFactor;

  gl_PointSize = uPointSize * uPixelRatio * (0.7 + 0.6 * shimmer) * (0.75 + 0.5 * aSeed) * (0.5 + 0.7 * depthFactor);
}
`;
