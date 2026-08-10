export default /* glsl */ `
varying vec3 vColor;
varying float vShimmer;
varying float vDepth;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  // Treat the point sprite as a lit sphere, not a flat glowing dot: derive a
  // hemisphere normal from where we are inside the circle (center = facing
  // the camera, rim = grazing away) and light it like a tiny 3D voxel/ball —
  // a highlight toward the light and a darker terminator toward the edge is
  // what actually reads as "volume" instead of a soft blob.
  float z = sqrt(max(0.0, 0.25 - d * d)) / 0.5;
  vec3 normal = normalize(vec3(uv * 2.0, z));
  vec3 lightDir = normalize(vec3(0.45, 0.65, 0.75));
  float diff = max(dot(normal, lightDir), 0.0);
  // Darken toward the rim rather than brighten the center — under additive
  // blending, boosting peak brightness on top of already-overlapping points
  // just blows everything out to white. Shaping the falloff downward instead
  // still reads as a lit sphere (bright core, dim edge) without raising the
  // total light each point contributes.
  float shade = 0.55 + 0.45 * diff;
  float specular = pow(diff, 24.0) * 0.18;

  float alpha = smoothstep(0.5, 0.42, d);
  vec3 color = vColor * shade * (0.85 + 0.7 * vShimmer) * (0.55 + 0.65 * vDepth) + specular;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
