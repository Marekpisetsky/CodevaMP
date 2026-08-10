import { reduceMotion } from './motion-prefs.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/·';

// Cycles random glyphs across a text node before landing on the final
// string, left-to-right — the "decoding" look used whenever a HUD label's
// text changes (igloo.inc does this on every portfolio-item transition).
export function createTextScrambler(node) {
  let frame = null;
  let current = node.textContent || '';

  function set(target, duration = 600) {
    if (reduceMotion) {
      node.textContent = target;
      current = target;
      return;
    }
    if (frame) cancelAnimationFrame(frame);
    const from = current;
    const maxLen = Math.max(from.length, target.length);
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      let out = '';
      for (let i = 0; i < maxLen; i++) {
        const charRevealT = i / maxLen; // stagger the reveal left-to-right
        if (t > charRevealT + 0.15) {
          out += target[i] ?? '';
        } else if (t > charRevealT) {
          out += CHARS[(Math.random() * CHARS.length) | 0];
        } else {
          out += from[i] ?? '';
        }
      }
      node.textContent = out;
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        node.textContent = target;
        current = target;
        frame = null;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  return { set };
}
