import SiteShell from "./components/site-shell";
import ForestScene from "./components/forest-scene";

export default function Page() {
  return (
    <SiteShell currentPath="/" disableEffects lockScroll>
      <section id="hero-section" className="scene-panel scene-panel--visual" aria-label="Escena interactiva">
        <ForestScene />
      </section>
    </SiteShell>
  );
}
