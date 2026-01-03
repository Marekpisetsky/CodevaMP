import SiteShell from "./components/site-shell";
import KeyboardScene from "./components/keyboard-scene";

export default function Page() {
  return (
    <SiteShell currentPath="/" disableEffects>
      <section id="hero-section" className="scene-panel scene-panel--visual" aria-label="Escena interactiva">
        <KeyboardScene />
      </section>
    </SiteShell>
  );
}
