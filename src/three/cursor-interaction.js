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

  // Returns { x, y, z, vx, vy, vz } in the figure's local space, or null.
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

    return { x: hit.x, y: hit.y, z: hit.z, vx, vy, vz };
  }

  function dispose() {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  return { update, dispose };
}
