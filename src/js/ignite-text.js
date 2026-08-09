// Split every h2 into individual letters (keeping <br> intact) so each
// one can ignite in sequence when its section scrolls into view,
// instead of the whole heading flashing at once.
function igniteSplit(el, baseDelay, step, className) {
  className = className || 'ignite-char';
  const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
  let i = 0;
  const out = parts.map(part => {
    if (/^<br/i.test(part)) return part;
    return part.split('').map(ch => {
      if (ch === ' ') return ' ';
      const delay = (baseDelay + i++ * step).toFixed(2);
      return `<span class="${className}" style="animation-delay:${delay}s">${ch}</span>`;
    }).join('');
  }).join('');
  el.innerHTML = '<span class="ignite-wrap">' + out + '</span>';
}

export function init() {
  document.querySelectorAll('h2').forEach(h2 => igniteSplit(h2, 0, 0.045));
  // The hero button ignites once on page load (it's above the fold,
  // no scroll needed); the CTA button waits until its own section's
  // title finishes igniting, so the two don't compete at the same instant.
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const loadTriggered = btn.classList.contains('reveal');
    igniteSplit(btn, loadTriggered ? 1.55 : 0, 0.03);
  });
}
