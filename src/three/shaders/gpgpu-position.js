// Simple Euler integration: this frame's position = last frame's position +
// this frame's velocity (computed by gpgpu-velocity.js, run just before
// this pass with the same dt).
export default /* glsl */ `
uniform float uDt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;

  gl_FragColor = vec4(pos + vel * uDt, 1.0);
}
`;
