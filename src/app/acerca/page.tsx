import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const milestones = [
  {
    year: "2021",
    title: "Primeros prototipos",
    description:
      "Exploraciones tempranas entre diseno, juego y animacion para entender como se sienten los sistemas interactivos.",
  },
  {
    year: "2023",
    title: "Laboratorio modular",
    description:
      "Se estructuran piezas en modulos reutilizables y se define el enfoque: interaccion antes que narrativa lineal.",
  },
  {
    year: "2024",
    title: "Colecciones abiertas",
    description:
      "Se abre la puerta a proyectos externos: arte, objetos digitales, animaciones y prototipos de distintas disciplinas.",
  },
  {
    year: "2025",
    title: "CodevaMP Studio",
    description:
      "El universo se formaliza como laboratorio creativo de sistemas interactivos y experiencias explorables.",
  },
];

const values = [
  {
    name: "Exploracion radical",
    detail:
      "Preferimos caminos no lineales. Cada pieza invita a tocar, mover y descubrir sin tutoriales largos.",
  },
  {
    name: "Belleza hibrida",
    detail:
      "Mezclamos tecnologia, arte, animacion y juego para construir experiencias sensibles y sorprendentes.",
  },
  {
    name: "Ritmo humano",
    detail:
      "Trabajamos por ciclos, no por urgencia. Las ideas necesitan tiempo para volverse explorables.",
  },
  {
    name: "Apertura creativa",
    detail:
      "Curamos trabajos de otras personas y compartimos procesos para expandir el laboratorio.",
  },
];

const studioRhythm = [
  { phase: "Semillas", focus: "Explorar conceptos y referencias", output: "Bocetos, moodboards, pruebas visuales" },
  { phase: "Prototipos", focus: "Construir interacciones minimas", output: "Piezas explorables de 1-3 minutos" },
  { phase: "Expansiones", focus: "Agregar capas sensoriales", output: "Sonido, motion, rutas alternativas" },
  { phase: "Colecciones", focus: "Publicar y curar", output: "Mapas, relatos y archivos vivos" },
];

export default function AcercaPage() {
  return (
    <SiteShell currentPath="/acerca">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Acerca del estudio</span>
          <h1 className="root-title">
            Creamos experiencias interactivas para una comunidad que quiere explorar, no solo mirar.
          </h1>
          <p className="root-subtitle">
            CodevaMP Studio mezcla tecnologia, creatividad y juego. Aqui las ideas se convierten en piezas vivas que la
            gente puede tocar, probar y compartir.
          </p>
          <div className="root-actions">
            <Link href="/explorar" prefetch className="root-action-button">
              Entrar al laboratorio
            </Link>
            <a
              href="https://www.youtube.com/@CodevaMPStudio"
              target="_blank"
              rel="noreferrer"
              className="root-action-button root-action-button--ghost"
            >
              Ver procesos en video
            </a>
          </div>
        </header>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Como funciona</h2>
            <p>
              Un flujo simple para mantener enfoque: explorar, prototipar, publicar y aprender con la comunidad.
            </p>
          </div>
          <div className="root-grid root-grid--two">
            {milestones.map((milestone) => (
              <article key={milestone.year} className="root-card root-card--compact">
                <span className="root-kicker">{milestone.year}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Principios creativos</h2>
            <p>
              Estas reglas mantienen coherencia entre proyectos, aunque cambie el formato.
            </p>
          </div>
          <div className="root-grid root-grid--two">
            {values.map((value) => (
              <article key={value.name} className="root-card root-card--compact">
                <h3>{value.name}</h3>
                <p>{value.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Ritmo del laboratorio</h2>
            <p>
              Cada etapa tiene una salida concreta para evitar confusion y mantener progreso.
            </p>
          </div>
          <div className="root-table-wrap">
            <table className="root-table">
              <thead>
                <tr>
                  <th scope="col">Fase</th>
                  <th scope="col">Enfoque</th>
                  <th scope="col">Salida</th>
                </tr>
              </thead>
              <tbody>
                {studioRhythm.map((block) => (
                  <tr key={block.phase}>
                    <td>{block.phase}</td>
                    <td>{block.focus}</td>
                    <td className="root-table-accent">{block.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <div>
              <h2>Como participar</h2>
              <p>
                Si tienes una idea o prototipo, puedes compartirlo y recibir feedback real.
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Compartir un proyecto
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
