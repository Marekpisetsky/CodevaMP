import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Radial zoom-blur + chromatic aberration, combined into one pass — the
// "camera cinemática" cue during a station-to-station transition (see
// camera-rig.js). Driven by a single 0..1 intensity uniform so it costs
// nothing extra to leave wired up: at 0 (settled on a station) every
// sample collapses to the same pixel, i.e. a plain passthrough render.
// `uFlash` is a second, independent effect layered on the same pass — a
// hard cut to a solid color, driven up to 1 only during the two transitions
// next to the void/hero station (see world-scene.js's applyProgressEffects).
// Peaking exactly when the screen is fully covered is what the void station
// switch relies on: the world/background-islands/props group gets toggled
// invisible at that same instant, so the pop is hidden behind the flash
// instead of visible as a sudden change mid-scene.
const TRANSITION_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0 },
    uFlash: { value: 0 },
    uFlashColor: { value: [0.02, 0.03, 0.05] },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uFlash;
    uniform vec3 uFlashColor;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float aberration = uIntensity * 0.008;
      float blur = uIntensity * 0.035;

      vec4 sum = vec4(0.0);
      const int SAMPLES = 6;
      for (int i = 0; i < SAMPLES; i++) {
        float t = float(i) / float(SAMPLES - 1);
        vec2 uv = vUv - center * blur * t;
        float r = texture2D(tDiffuse, uv - center * aberration).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv + center * aberration).b;
        sum += vec4(r, g, b, 1.0);
      }
      vec4 color = sum / float(SAMPLES);
      color.rgb = mix(color.rgb, uFlashColor, uFlash);
      gl_FragColor = color;
    }
  `,
};

export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const transitionPass = new ShaderPass(TRANSITION_SHADER);
  composer.addPass(transitionPass);
  // EffectComposer's intermediate render targets are linear-space — without
  // this final pass converting back to sRGB (what renderer.render() does
  // automatically for you, but a raw ShaderPass chain doesn't), dark values
  // crush toward black disproportionately more than bright ones, which is
  // exactly why the terrain nearly vanished while the bright hero figure
  // still mostly read fine.
  composer.addPass(new OutputPass());

  function setIntensity(t) {
    transitionPass.uniforms.uIntensity.value = t;
  }
  function setFlash(t) {
    transitionPass.uniforms.uFlash.value = t;
  }
  function setSize(width, height) {
    composer.setSize(width, height);
  }
  function render() {
    composer.render();
  }
  function dispose() {
    composer.dispose();
  }

  return { setIntensity, setFlash, setSize, render, dispose };
}
