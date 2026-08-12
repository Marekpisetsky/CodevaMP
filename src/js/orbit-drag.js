// Drag-to-look-around for the island — replaces the old station-to-station
// vertical scroll for exploring what's on the island itself (see
// world-scene.js's plan). Rotating `target` (the island group) instead of
// moving the camera in an actual orbit is the simplification: the visual
// result is identical (see the island from another angle) but it needs no
// new camera math and can never fight camera-rig.js's own position/lookAt
// interpolation, since it's a completely separate transform.
//
// Pointer Events unify mouse/touch/pen already, so one set of listeners
// covers drag-to-spin on both desktop and mobile. A drag decays into
// momentum on release (flick-and-coast) rather than stopping dead, the same
// "feels alive, not clinical" instinct behind the damping already used in
// virtual-scroll.js and particle-physics.js.
const SENSITIVITY = 0.0065; // radians of rotation per pixel dragged
const DAMPING = 2.2; // how fast momentum decays after release

export function createOrbitDrag({ target, container }) {
  let angle = 0;
  let angularVelocity = 0; // radians/sec, carried into inertia after release
  let dragging = false;
  let lastX = 0;
  let lastMoveTime = 0;

  function onPointerDown(e) {
    dragging = true;
    lastX = e.clientX;
    lastMoveTime = performance.now();
    angularVelocity = 0;
    container.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(0.001, (now - lastMoveTime) / 1000);
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    lastMoveTime = now;

    const deltaAngle = dx * SENSITIVITY;
    angle += deltaAngle;
    angularVelocity = deltaAngle / dt;
  }

  function onPointerUp() {
    dragging = false;
    container.style.cursor = 'grab';
  }

  container.style.cursor = 'grab';
  container.style.touchAction = 'none'; // a horizontal drag here must not also pan/scroll the page on touch
  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function update(dt) {
    if (!dragging) {
      angle += angularVelocity * dt;
      angularVelocity *= Math.exp(-DAMPING * dt);
    }
    target.rotation.y = angle;
  }

  function dispose() {
    container.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    container.style.cursor = '';
    container.style.touchAction = '';
  }

  return { update, dispose };
}
