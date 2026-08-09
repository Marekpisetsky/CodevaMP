export default /* glsl */ `
varying vec3 vColor;
varying float vShimmer;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d);
  if (alpha <= 0.0) discard;

  vec3 color = vColor * (0.85 + 0.7 * vShimmer);
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
