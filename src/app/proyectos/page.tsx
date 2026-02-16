import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const projectCollections = [
  {
    name: "Interfaces vivas",
    description: "Experimentos visuales e interactivos que responden al ritmo del usuario.",
    initiatives: [
      { title: "Topografias mutantes", detail: "Mapas sensibles al gesto y al tiempo de exploracion." },
      { title: "Ventanas respirables", detail: "Layouts modulares que se reorganizan con luz y sonido." },
      { title: "Cartografias fluidas", detail: "Rutas no lineales para descubrir historias en capas." },
    ],
  },
  {
    name: "Arte y animacion",
    description: "Piezas animadas, objetos digitales y sistemas expresivos curados por el estudio.",
    initiatives: [
      { title: "Loops organicos", detail: "Animaciones breves como artefactos sensoriales." },
      { title: "Esculturas digitales", detail: "Formas que viven entre lo fisico y lo digital." },
    ],
  },
  {
    name: "Prototipos jugables",
    description: "Microjuegos y experiencias cortas que exploran mecanicas nuevas.",
    initiatives: [
      { title: "Pasillos interactivos", detail: "Juegos breves con enfoque en presencia y ritmo." },
      { title: "Sistemas de decision", detail: "Prototipos que reaccionan a elecciones sutiles." },
    ],
  },
];

const calls = [
  {
    title: "Convocatoria permanente",
    detail: "Recibimos piezas de artistas, animadores, disenadores y personas curiosas.",
  },
  {
    title: "Residencias modulares",
    detail: "Acompanamos proyectos en proceso con feedback y exploracion conjunta.",
  },
  {
    title: "Colecciones tematicas",
    detail: "Curamos series de obras con un hilo sensorial o conceptual compartido.",
  },
];

export default function ProyectosPage() {
  return (
    <SiteShell currentPath="/proyectos">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Proyectos y colecciones</span>
          <h1 className="root-title">Colecciones explorables en expansion</h1>
          <p className="root-subtitle">
            CodevaMP Studio publica proyectos propios y de otras personas. No es un portafolio, es un archivo vivo de
            exploraciones interactivas, arte y sistemas en movimiento.
          </p>
          <Link href="/explorar" prefetch className="root-action-button">
            Ir al laboratorio
          </Link>
        </header>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Colecciones principales</h2>
          </div>
          <div className="root-grid root-grid--three">
            {projectCollections.map((category) => (
              <article key={category.name} className="root-card">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <ul className="root-list">
                  {category.initiatives.map((initiative) => (
                    <li key={initiative.title}>
                      <strong>{initiative.title}</strong>
                      <span>{initiative.detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <h2>Convocatorias abiertas</h2>
            <p>
            Queremos sumar exploraciones de distintas disciplinas. Comparte tu pieza y la curamos en el archivo vivo.
            </p>
          </div>
          <div className="root-grid root-grid--three">
            {calls.map((call) => (
              <article key={call.title} className="root-card root-card--compact">
                <h3>{call.title}</h3>
                <p>{call.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <div>
              <h2>Quieres participar?</h2>
              <p>
              Envia tu propuesta y la hacemos parte del universo CodevaMP Studio.
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Compartir proyecto
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
