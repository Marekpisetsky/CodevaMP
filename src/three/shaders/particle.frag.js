export default /* glsl */ `
varying vec3 vColor;
varying float vShimmer;
varying float vDepth;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d);
  if (alpha <= 0.0) discard;

  vec3 color = vColor * (0.85 + 0.7 * vShimmer) * (0.55 + 0.65 * vDepth);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
