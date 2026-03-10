import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const projectCollections = [
  {
    name: "Interfaces vivas",
    description: "Experimentos visuales e interactivos que reaccionan al ritmo de uso.",
    initiatives: [
      { title: "Topografias mutantes", detail: "Mapas sensibles al gesto y al tiempo de exploracion." },
      { title: "Ventanas respirables", detail: "Layouts modulares que se reorganizan con luz y sonido." },
      { title: "Cartografias fluidas", detail: "Rutas no lineales para descubrir historias en capas." },
    ],
  },
  {
    name: "Arte y animacion",
    description: "Piezas animadas y sistemas expresivos curados dentro del estudio.",
    initiatives: [
      { title: "Loops organicos", detail: "Animaciones breves como artefactos sensoriales." },
      { title: "Esculturas digitales", detail: "Formas que viven entre lo fisico y lo digital." },
    ],
  },
  {
    name: "Prototipos jugables",
    description: "Microjuegos y experiencias cortas para probar mecanicas nuevas.",
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
          <h1 className="root-title">Aqui se organiza todo lo que ya esta construyendose</h1>
          <p className="root-subtitle">
            Esta pagina funciona como archivo vivo: muestra lineas activas, su madurez y donde puedes sumarte.
          </p>
          <div className="story-arc" aria-label="Recorrido narrativo principal">
            <Link href="/acerca" prefetch className="story-arc__item is-done">1. Acerca</Link>
            <Link href="/explorar" prefetch className="story-arc__item is-done">2. Explorar</Link>
            <Link href="/proyectos" prefetch className="story-arc__item is-active">3. Proyectos</Link>
          </div>
          <div className="story-intro-strip" aria-label="Resumen rapido de proyectos">
            <article className="story-intro-item">
              <strong>Curaduria</strong>
              <span>Seleccion de piezas con criterio comun</span>
            </article>
            <article className="story-intro-item">
              <strong>Iteracion</strong>
              <span>Mejoras abiertas por ciclos</span>
            </article>
            <article className="story-intro-item">
              <strong>Entrada</strong>
              <span>Convocatorias para sumar trabajo nuevo</span>
            </article>
          </div>
          <div className="root-actions">
            <Link href="/explorar" prefetch className="root-action-button">
              Volver a Explorar
            </Link>
            <Link href="/dev" prefetch className="root-action-button root-action-button--ghost">
              Entrar a Dev
            </Link>
          </div>
        </header>

        <section className="root-section story-section">
          <div className="root-section-header">
            <p className="root-kicker">Acto I - Colecciones</p>
            <h2>Colecciones principales</h2>
            <p>Estas son las tres lineas donde se agrupa el trabajo activo del estudio.</p>
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

        <section className="root-section story-section">
          <div className="root-section-header">
            <p className="root-kicker">Acto II - Apertura</p>
            <h2>Convocatorias abiertas</h2>
            <p>Canales de entrada para personas que quieren sumar piezas al archivo.</p>
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

        <section className="root-section story-section">
          <div className="root-split">
            <div>
              <h2>Acto III - Ejecucion</h2>
              <p>Si ya tienes propuesta, compartela y te indicamos por cual linea encaja mejor.</p>
            </div>
            <a
              href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Enviar propuesta
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
