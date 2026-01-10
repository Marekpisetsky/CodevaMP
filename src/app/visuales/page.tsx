import type { CSSProperties } from "react";
import Link from "next/link";
import SiteShell from "../components/site-shell";

const visualesHighlights = [
  {
    title: "Celestial pop",
    detail: "Paisajes de color saturado con brillo orbital, halos y destellos suaves.",
  },
  {
    title: "Kawaii fantastico",
    detail: "Formas amables, ritmos juguetones y detalles que invitan a tocar.",
  },
  {
    title: "Anti-realismo japones",
    detail: "Reglas propias, gravedad flexible y narrativa sensorial.",
  },
];

const visualesFragments = [
  { x: "8%", y: "18%", s: "22px", r: "-18deg" },
  { x: "18%", y: "62%", s: "14px", r: "24deg" },
  { x: "28%", y: "32%", s: "12px", r: "-32deg" },
  { x: "64%", y: "22%", s: "18px", r: "12deg" },
  { x: "72%", y: "46%", s: "10px", r: "-20deg" },
  { x: "84%", y: "28%", s: "16px", r: "32deg" },
  { x: "78%", y: "68%", s: "20px", r: "-12deg" },
  { x: "40%", y: "76%", s: "12px", r: "18deg" },
];

export default function VisualesPage() {
  return (
    <SiteShell currentPath="/visuales" disableEffects>
      <section className="visuales-hero" aria-labelledby="visuales-title">
        <div className="visuales-sky" aria-hidden />
        <div className="visuales-orbit" aria-hidden />
        <div className="visuales-glow" aria-hidden />
        <div className="visuales-fragments" aria-hidden>
          {visualesFragments.map((fragment, index) => (
            <span
              key={`visuales-fragment-${index}`}
              className="visuales-fragment"
              style={
                {
                  "--fx": fragment.x,
                  "--fy": fragment.y,
                  "--fs": fragment.s,
                  "--fr": fragment.r,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="visuales-content">
          <p className="visuales-eyebrow">CodevaMP Visuales</p>
          <h1 id="visuales-title" className="visuales-title">
            Una submarca nacida para explorar fantasia celestial, color extremo y narrativas pop.
          </h1>
          <p className="visuales-sub">
            Visuales es un universo donde la luz y el ritmo son lenguaje. Creamos escenas que se comportan como
            portales: todo vibra, todo responde, todo invita a perderse por un instante.
          </p>
          <div className="visuales-actions">
            <Link href="/" className="visuales-button visuales-button--primary">
              Volver al estudio
            </Link>
            <button type="button" className="visuales-button visuales-button--ghost">
              Explorar proyectos
            </button>
          </div>
        </div>
      </section>

      <section className="visuales-panel" aria-label="Claves visuales">
        <div className="visuales-panel__inner">
          {visualesHighlights.map((item) => (
            <div key={item.title} className="visuales-card">
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
