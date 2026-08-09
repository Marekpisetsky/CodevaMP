// Lore glossary: wraps the first mention of a few key terms in a
// hover tooltip with a short definition, without touching every
// repeated occurrence in the text.
export function init() {
  const frame = document.querySelector('.lore-frame');
  if (!frame) return;

  const terms = [
    { term: 'Cendraria', def: 'El reino de la Llama Negra, donde nace todo el poder de esta historia.' },
    { term: 'la Grieta', def: 'El único umbral que no da, sino que quita. Se abre solo para quien no tiene nada más que perder.' },
    { term: 'Casa Rescoldo', def: 'La primera casa de Cendraria. Existen dos versiones: la que robó el nombre, y la que lo merece.' }
  ];

  let html = frame.innerHTML;
  terms.forEach(({ term, def }) => {
    const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp('(' + escaped + ')');
    html = html.replace(re, (match) =>
      `<span class="glossary-term" tabindex="0" data-def="${def}">${match}</span>`
    );
  });
  frame.innerHTML = html;

  // On touch devices there's no hover, so tapping a term toggles its
  // tooltip instead; tapping elsewhere closes any open one.
  if (window.matchMedia('(hover: none)').matches) {
    frame.querySelectorAll('.glossary-term').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = el.classList.contains('show');
        document.querySelectorAll('.glossary-term.show').forEach(t => t.classList.remove('show'));
        if (!wasOpen) el.classList.add('show');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.glossary-term.show').forEach(t => t.classList.remove('show'));
    });
  }
}
