import * as THREE from 'three';

// Raycasts the pointer against a plane facing the camera and passing through
// the figure, and converts both the hit point and its frame-to-frame motion
// into the figure's local space (it keeps rotating, so a fixed world point
// maps to a different local point each frame). The velocity vector — not
// just proximity — is what the physics sim uses to "carry" particles along
// a slow drag and merely "dash" them on a fast swipe, instead of a generic
// push-away-from-cursor field.
const MAX_CURSOR_SPEED = 90;

export function createCursorTracker({ camera, points, renderer }) {
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2(9999, 9999);
  const plane = new THREE.Plane();
  const planeNormal = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const prevLocal = new THREE.Vector3();
  // Reused every frame instead of returning a fresh object literal from
  // update() — the animation loop should not be allocating.
  const state = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
  let active = false;
  let hasPrev = false;

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    active = true;
  }
  function onPointerLeave() {
    active = false;
    hasPrev = false;
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  // Returns the shared `state` object ({x,y,z,vx,vy,vz} in the figure's
  // local space) with fresh values, or null. The returned reference is the
  // same object every call — copy out of it if it needs to outlive the
  // frame, don't retain it expecting it to stay unchanged.
  function update(dt) {
    if (!active) {
      hasPrev = false;
      return null;
    }
    camera.getWorldDirection(planeNormal);
    plane.setFromNormalAndCoplanarPoint(planeNormal, points.position);
    raycaster.setFromCamera(pointerNdc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return null;
    points.worldToLocal(hit);

    let vx = 0, vy = 0, vz = 0;
    if (hasPrev && dt > 0) {
      vx = (hit.x - prevLocal.x) / dt;
      vy = (hit.y - prevLocal.y) / dt;
      vz = (hit.z - prevLocal.z) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (speed > MAX_CURSOR_SPEED) {
        const s = MAX_CURSOR_SPEED / speed;
        vx *= s; vy *= s; vz *= s;
      }
    }
    prevLocal.copy(hit);
    hasPrev = true;

    state.x = hit.x; state.y = hit.y; state.z = hit.z;
    state.vx = vx; state.vy = vy; state.vz = vz;
    return state;
  }

  function dispose() {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  return { update, dispose };
}
