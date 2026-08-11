import * as THREE from 'three';

const _lookAt = new THREE.Vector3();
const _backDir = new THREE.Vector3();

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Drives a camera through a sequence of "stations" ({position, lookAt}) by
// a continuous progress value, fed each frame by virtual-scroll.js.
// Mid-transition the camera bumps further back than either endpoint before
// settling in — the "se aleja antes de avanzar, viendo que todo es parte
// integral" cue from the igloo.inc reference, not just a straight lerp
// between two poses. Progress wraps modulo stations.length in both
// directions — scrolling backward past station 0 continues into the last
// station instead of dead-ending, "como si nunca se terminara de dar
// vueltas" — virtual-scroll.js is what decides whether a given direction
// is actually allowed to wrap versus handing off to native scroll; this
// only needs to make an out-of-range progress value meaningful.
export function createCameraRig({ camera, stations, pullBackDistance = 16 }) {
  function applyProgress(progress) {
    const n = stations.length;
    const wrapped = ((progress % n) + n) % n;
    const i0 = Math.floor(wrapped);
    const i1 = (i0 + 1) % n;
    const localT = wrapped - i0;
    const a = stations[i0], b = stations[i1];

    const t = easeInOutCubic(localT);
    camera.position.lerpVectors(a.position, b.position, t);
    _lookAt.lerpVectors(a.lookAt, b.lookAt, t);

    const bump = Math.sin(t * Math.PI) * pullBackDistance;
    if (bump > 0.001) {
      _backDir.copy(camera.position).sub(_lookAt).normalize();
      camera.position.addScaledVector(_backDir, bump);
    }

    camera.lookAt(_lookAt);
  }

  return { applyProgress };
}
