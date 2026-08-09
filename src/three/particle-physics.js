import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import velocityShader from './shaders/gpgpu-velocity.js';
import positionShader from './shaders/gpgpu-position.js';

// Same physics as before (spring back to rest, cursor impulse + scatter,
// disturbance-gated return — see gpgpu-velocity.js for the actual per-
// particle formulas), now run as two ping-ponged GPU textures instead of a
// JS loop over Float32Arrays. That loop measured ~24fps at ~100k particles;
// this is what makes that particle count hold 60fps, since each texel is
// computed in parallel rather than one at a time on the main thread.
export function createParticlePhysics({ renderer, basePositions, count }) {
  const size = Math.ceil(Math.sqrt(count));

  const gpuCompute = new GPUComputationRenderer(size, size, renderer);

  const positionTexture = gpuCompute.createTexture();
  const baseTexture = gpuCompute.createTexture();
  fillPositionData(positionTexture, basePositions, count);
  fillPositionData(baseTexture, basePositions, count);
  const velocityTexture = gpuCompute.createTexture(); // zero-initialized: no velocity, no disturbance

  const velocityVariable = gpuCompute.addVariable('textureVelocity', velocityShader, velocityTexture);
  const positionVariable = gpuCompute.addVariable('texturePosition', positionShader, positionTexture);

  gpuCompute.setVariableDependencies(velocityVariable, [velocityVariable, positionVariable]);
  gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

  Object.assign(velocityVariable.material.uniforms, {
    textureBasePosition: { value: baseTexture },
    uDt: { value: 0 },
    uTime: { value: 0 },
    uCursorActive: { value: 0 },
    uCursorPos: { value: new THREE.Vector3() },
    uCursorVel: { value: new THREE.Vector3() },
  });
  positionVariable.material.uniforms.uDt = { value: 0 };

  const error = gpuCompute.init();
  if (error !== null) throw new Error('GPUComputationRenderer init failed: ' + error);

  function update(dt, cursor, time) {
    if (dt <= 0) return;

    const vUniforms = velocityVariable.material.uniforms;
    vUniforms.uDt.value = dt;
    vUniforms.uTime.value = time;
    if (cursor) {
      vUniforms.uCursorActive.value = 1;
      vUniforms.uCursorPos.value.set(cursor.x, cursor.y, cursor.z);
      vUniforms.uCursorVel.value.set(cursor.vx, cursor.vy, cursor.vz);
    } else {
      vUniforms.uCursorActive.value = 0;
    }
    positionVariable.material.uniforms.uDt.value = dt;

    gpuCompute.compute();
  }

  function getPositionTexture() {
    return gpuCompute.getCurrentRenderTarget(positionVariable).texture;
  }

  return { size, update, getPositionTexture, dispose: () => gpuCompute.dispose() };
}

// Fills a GPUComputationRenderer texture (RGBA Float32Array, row-major) with
// one particle's xyz per texel, matching the reference-uv layout built in
// scene.js (same i -> (i % size, floor(i / size)) mapping on both sides).
function fillPositionData(texture, positions, count) {
  const data = texture.image.data;
  for (let i = 0; i < count; i++) {
    data[i * 4] = positions[i * 3];
    data[i * 4 + 1] = positions[i * 3 + 1];
    data[i * 4 + 2] = positions[i * 3 + 2];
    data[i * 4 + 3] = 1;
  }
  texture.needsUpdate = true;
}
