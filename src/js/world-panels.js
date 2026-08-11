// Cross-fades whatever DOM content each station still has (destacado's
// video panel, modalidades' carousel — hero and cta are pure 3D world now,
// no DOM overlay) based on the same camera progress value driving
// world-scene.js's camera-rig. Elements are found generically by a
// `data-station` attribute; .is-active is what site.css keys each one's
// opacity off of.
//
// `stationCount` wraps the rounded progress the same way camera-rig.js
// wraps it for rendering — virtual-scroll.js's progress value is
// unbounded (it grows/shrinks past the [0, stationCount) range as the
// user keeps scrolling in one direction), so this has to wrap it back
// down itself rather than comparing it raw against each panel's index.
export function createWorldPanels(panelEls, stationCount) {
  const panels = Array.from(panelEls).map((el) => ({
    el,
    station: Number(el.dataset.station),
  }));

  function apply(progress, engaged) {
    const active = engaged
      ? (((Math.round(progress) % stationCount) + stationCount) % stationCount)
      : -1;
    for (const p of panels) {
      p.el.classList.toggle('is-active', p.station === active);
    }
  }

  return { apply };
}
