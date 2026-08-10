import * as THREE from 'three';
import { FIGURE_HEIGHT } from './skin-parser.js';
import { createStage } from './stage.js';
import { createHudLabel } from './hud-label.js';
import { buildParticleSystem } from './scene.js';

// Ambient background stage for the "Destacado" section — the video
// thumbnail itself already sits on an opaque panel (see .video-frame in
// site.css) so it stays legible regardless; this is just the isolated
// "environment" behind the surrounding text/copy, framed on the torso
// instead of the hero's full body or the CTA's head, for variety.
export async function createVideoScene(container, skinUrl) {
  const stage = await createStage({
    container,
    buildContent: (tier) => buildParticleSystem(skinUrl, tier),
    cameraConfig: {
      centerY: FIGURE_HEIGHT * 0.4,
      halfHeight: FIGURE_HEIGHT * 0.5,
      idleZoom: 1,
      settledZoom: 0.92,
    },
  });

  const label = createHudLabel({
    container,
    camera: stage.camera,
    getObject: stage.getContentObject,
    anchor: new THREE.Vector3(0, FIGURE_HEIGHT * 0.75, 0), // shoulder height — stays inside this tighter torso-framed crop
    title: 'CODEVAMP_03',
    sub: 'STREAM.LOG',
  });

  const dispose = stage.dispose;
  stage.dispose = () => {
    label.dispose();
    dispose();
  };

  return stage;
}
