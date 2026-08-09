import * as THREE from 'three';

// Raycasts the pointer against a plane facing the camera and passing through
// the figure, converts the hit into the figure's local space (it keeps
// rotating, so the same world point maps to a different local point each
// frame), and tracks how fast that point is moving so a fast swipe hits
// harder than just resting the cursor nearby — closer to actually hitting
// something than a uniform proximity field.
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

  // Returns { x, y, z, speed } in the figure's local space, or null if idle.
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

    let speed = 0;
    if (hasPrev && dt > 0) {
      speed = Math.min(hit.distanceTo(prevLocal) / dt, 60);
    }
    prevLocal.copy(hit);
    hasPrev = true;

    return { x: hit.x, y: hit.y, z: hit.z, speed };
  }

  function dispose() {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  return { update, dispose };
}
