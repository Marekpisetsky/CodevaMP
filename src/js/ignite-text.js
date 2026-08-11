// Split every h2 into individual letters (keeping <br> intact) so each
// one can ignite in sequence when its section scrolls into view,
// instead of the whole heading flashing at once.
function igniteSplit(el, baseDelay, step, className) {
  className = className || 'ignite-char';
  const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
  let i = 0;
  const out = parts.map(part => {
    if (/^<br/i.test(part)) return part;
    // Each letter is its own inline-block span (needed so the per-letter
    // translateY animation actually applies — transforms don't affect
    // plain inline elements). With no whitespace between them, adjacent
    // inline-blocks are still a line-break opportunity in Chrome, so on a
    // narrow column a word can wrap mid-letter. Grouping each word's
    // letters under a white-space:nowrap wrapper keeps the word intact;
    // wrapping can still happen at the real space between words.
    return part.split(/( )/).map(word => {
      if (word === ' ') return ' ';
      if (!word) return '';
      const letters = word.split('').map(ch => {
        const delay = (baseDelay + i++ * step).toFixed(2);
        return `<span class="${className}" style="animation-delay:${delay}s">${ch}</span>`;
      }).join('');
      return `<span class="ignite-word">${letters}</span>`;
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
