export default /* glsl */ `
attribute float aSeed;

uniform float uTime;
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uAmbientJitter;

varying vec3 vColor;
varying float vShimmer;
varying float vDepth;

void main() {
  // Cheap, always-on per-particle "foam" wobble — every particle gets this
  // regardless of whether the CPU-side physics (particle-physics.js) has
  // currently activated it. It's what keeps the surface visibly breathing
  // everywhere, not just wherever the cursor has touched, at essentially
  // no extra cost: the vertex shader already runs once per particle per
  // frame just to draw it, so a few more sin() calls here are effectively
  // free — unlike doing the same per-particle work in the CPU physics
  // loop, which is exactly what the activity gate exists to avoid paying
  // for on particles nothing is currently interacting with.
  float jx = sin(uTime * 1.7 + aSeed * 41.3);
  float jy = sin(uTime * 2.1 + aSeed * 77.9 + 1.5708);
  float jz = sin(uTime * 1.3 + aSeed * 19.7 + 3.1416);
  vec3 jittered = position + vec3(jx, jy, jz) * uAmbientJitter;

  float shimmer = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831853);
  vShimmer = shimmer;
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(jittered, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Orthographic projection alone gives no size-by-distance cue, so a
  // rotating additive-blended cloud with no lighting reads as ambiguous —
  // like the classic silhouette-spinning illusion, direction is genuinely
  // hard to tell apart from its mirror. Faking depth here (nearer = bigger
  // and brighter) gives the eye something real to resolve rotation with.
  float depthFactor = smoothstep(-7.0, 7.0, mvPosition.z);
  vDepth = depthFactor;

  // Floors raised from the previous version (which could multiply down to
  // ~26% of uPointSize in the worst case) — too many small points at once
  // is what read as visible gaps in the surface instead of a solid, foamy
  // volume.
  gl_PointSize = uPointSize * uPixelRatio * (0.85 + 0.45 * shimmer) * (0.85 + 0.3 * aSeed) * (0.55 + 0.65 * depthFactor);
}
`;
