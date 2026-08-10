import * as THREE from 'three';
import { FIGURE_HEIGHT } from './skin-parser.js';
import { createStage } from './stage.js';
import { createHudLabel } from './hud-label.js';
import { buildParticleSystem } from './scene.js';

// Second concurrent stage instance (proves the multi-stage lifecycle from
// the plan's Fase 3) — reprises the same voxel figure as a closing beat,
// framed tighter on the head/shoulders instead of the hero's full body.
export async function createCtaScene(container, skinUrl) {
  const stage = await createStage({
    container,
    buildContent: (tier) => buildParticleSystem(skinUrl, tier),
    cameraConfig: {
      centerY: FIGURE_HEIGHT * 0.78,
      halfHeight: FIGURE_HEIGHT * 0.24,
      idleZoom: 1,
      settledZoom: 0.88,
    },
  });

  const label = createHudLabel({
    container,
    camera: stage.camera,
    getObject: stage.getContentObject,
    anchor: new THREE.Vector3(0, FIGURE_HEIGHT, 0),
    title: 'CODEVAMP_02',
    sub: 'JOIN.NOW',
  });

  const dispose = stage.dispose;
  stage.dispose = () => {
    label.dispose();
    dispose();
  };

  return stage;
}
