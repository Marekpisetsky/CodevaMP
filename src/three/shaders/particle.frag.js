export default /* glsl */ `
varying vec3 vColor;
varying float vShimmer;

void main() {
  vec2 edge = abs(gl_PointCoord - 0.5);
  float square = max(edge.x, edge.y);
  if (square > 0.5) discard;
  float edgeFade = smoothstep(0.5, 0.4, square);

  vec3 color = vColor * (0.75 + 0.45 * vShimmer);
  gl_FragColor = vec4(color, edgeFade);
}
`;
