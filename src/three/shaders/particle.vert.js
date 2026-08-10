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
  // Always-on per-particle motion, regardless of whether the CPU-side
  // physics (particle-physics.js) currently has this particle activated —
  // free on the GPU, since the vertex shader already runs once per particle
  // per frame just to draw it. Two things make this read as contained
  // energy straining against the shape rather than a calm uniform breathing:
  // a faster base wobble layered with a higher-frequency second octave (a
  // clean single sine reads as gentle/organic; two mismatched frequencies
  // beating against each other reads as agitated), and a slow per-particle
  // "surge" that periodically pushes each particle's amplitude well past
  // its own average before easing back — so different parts of the surface
  // are visibly bulging outward and getting reeled back in at any given
  // moment, not everything breathing in lockstep.
  float surge = 0.4 + 1.4 * (0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 11.3));
  float amp = uAmbientJitter * surge;

  float jx = sin(uTime * 3.1 + aSeed * 41.3) + 0.55 * sin(uTime * 5.7 + aSeed * 13.1);
  float jy = sin(uTime * 3.6 + aSeed * 77.9 + 1.5708) + 0.55 * sin(uTime * 6.1 + aSeed * 29.7);
  float jz = sin(uTime * 2.8 + aSeed * 19.7 + 3.1416) + 0.55 * sin(uTime * 4.9 + aSeed * 53.3);
  vec3 jittered = position + vec3(jx, jy, jz) * amp;

  float shimmer = 0.5 + 0.5 * sin(uTime * 2.6 + aSeed * 6.2831853);
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

  // The relative floors above still multiply down to ~40% of uPointSize in
  // the worst case (all three factors at their minimum simultaneously) —
  // on a pixelRatio-1 display that's under 1 actual device pixel, and a
  // sub-pixel point sprite doesn't reliably rasterize every frame: it can
  // flicker in and out depending on where its center lands relative to the
  // pixel grid, which reads as points randomly disappearing rather than
  // just looking small. Clamp to an absolute pixel floor so no point can
  // ever shrink below something a screen can actually render consistently.
  gl_PointSize = max(1.8, uPointSize * uPixelRatio * (0.85 + 0.45 * shimmer) * (0.85 + 0.3 * aSeed) * (0.55 + 0.65 * depthFactor));
}
`;
