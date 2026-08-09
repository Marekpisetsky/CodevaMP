import * as THREE from 'three';

// Raycasts the pointer against a plane facing the camera and passing through
// the figure, then converts the hit point into the figure's local space
// (it keeps rotating, so the same world point maps to a different local
// point each frame) — that local point is what the shader displaces around.
export function createCursorTracker({ camera, points, renderer }) {
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2(9999, 9999);
  const plane = new THREE.Plane();
  const planeNormal = new THREE.Vector3();
  const hit = new THREE.Vector3();
  let active = false;

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    active = true;
  }
  function onPointerLeave() {
    active = false;
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  function update(uCursor) {
    if (!active) return false;
    camera.getWorldDirection(planeNormal);
    plane.setFromNormalAndCoplanarPoint(planeNormal, points.position);
    raycaster.setFromCamera(pointerNdc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return false;
    points.worldToLocal(hit);
    uCursor.copy(hit);
    return true;
  }

  function dispose() {
    renderer.domElement.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  return { update, dispose };
}
