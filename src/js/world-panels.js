// Cross-fades every station's DOM content (the hero's own .hero-inner/
// .hero-scrim for station 0, the destacado/modalidades/cta panels for 1-3)
// based on the same camera progress value driving world-scene.js's
// camera-rig. Elements are found generically by a `data-station` attribute;
// .is-active is what site.css keys each one's opacity off of.
export function createWorldPanels(panelEls) {
  const panels = Array.from(panelEls).map((el) => ({
    el,
    station: Number(el.dataset.station),
  }));

  function apply(progress, engaged) {
    const active = engaged ? Math.round(progress) : -1;
    for (const p of panels) {
      p.el.classList.toggle('is-active', p.station === active);
    }
  }

  return { apply };
}
