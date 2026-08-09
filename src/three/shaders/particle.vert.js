export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vShimmer;

void main() {
  float shimmer = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uPointSize * uPixelRatio * (0.7 + 0.6 * shimmer) * (0.75 + 0.5 * aSeed);
}
`;
