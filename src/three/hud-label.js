import * as THREE from 'three';
import { createTextScrambler } from '../js/utils/text-scramble.js';

// Projects a local-space point on a rotating stage object to screen space
// every frame and pins a DOM label there — the "PORTFOLIO_CO_03 / ABSTRACT"
// style HUD tag from the igloo.inc reference, anchored to a real 3D point
// instead of a fixed screen position.
// `getObject` is a getter, not a static Object3D — the anchor target can be
// swapped out from under a label (e.g. a stage's tier-downgrade rebuild
// replaces its content object wholesale), so it's re-resolved every frame
// instead of captured once at creation time.
export function createHudLabel({ container, camera, getObject, anchor, title, sub }) {
  const el = document.createElement('div');
  el.className = 'hud-label';
  el.innerHTML = `
    <span class="hud-label__marker"></span>
    <span class="hud-label__line"></span>
    <div class="hud-label__text">
      <div class="hud-label__title"></div>
      <div class="hud-label__sub"></div>
    </div>
  `;
  container.appendChild(el);

  const titleEl = el.querySelector('.hud-label__title');
  const subEl = el.querySelector('.hud-label__sub');
  const titleScrambler = createTextScrambler(titleEl);
  const subScrambler = createTextScrambler(subEl);
  titleScrambler.set(title);
  subScrambler.set(sub);

  const worldPoint = new THREE.Vector3(); // reused every frame, no per-frame allocation
  let raf = null;

  function frame() {
    const object = getObject();
    worldPoint.copy(anchor).applyMatrix4(object.matrixWorld);
    worldPoint.project(camera);

    if (worldPoint.z > 1 || worldPoint.z < -1) {
      el.classList.remove('is-visible');
    } else {
      const rect = container.getBoundingClientRect();
      const x = (worldPoint.x * 0.5 + 0.5) * rect.width;
      const y = (1 - (worldPoint.y * 0.5 + 0.5)) * rect.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.classList.add('is-visible');
    }
    raf = requestAnimationFrame(frame);
  }

  function ensureLoop() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }
  ensureLoop();
  const onVisibility = () => { if (document.hidden) stopLoop(); else ensureLoop(); };
  document.addEventListener('visibilitychange', onVisibility);

  function setText(nextTitle, nextSub) {
    titleScrambler.set(nextTitle);
    subScrambler.set(nextSub);
  }

  function dispose() {
    stopLoop();
    document.removeEventListener('visibilitychange', onVisibility);
    el.remove();
  }

  return { el, setText, dispose };
}
