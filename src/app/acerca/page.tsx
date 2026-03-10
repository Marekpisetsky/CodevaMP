import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const milestones = [
  {
    chapter: "Capitulo 01",
    title: "Origen",
    description: "Nace como pruebas cortas entre diseno, juego y animacion para descubrir que vale la pena construir.",
  },
  {
    chapter: "Capitulo 02",
    title: "Metodo",
    description: "Se vuelve un sistema modular: menos discurso, mas interaccion real y ciclos de mejora continuos.",
  },
  {
    chapter: "Capitulo 03",
    title: "Apertura",
    description: "Se integran aportes externos para convertir el estudio en un archivo vivo en vez de un portfolio cerrado.",
  },
  {
    chapter: "Capitulo 04",
    title: "CodevaMP Studio",
    description: "Se consolida como laboratorio creativo con rutas claras para explorar, publicar y colaborar.",
  },
];

const values = [
  {
    name: "Interaccion primero",
    detail: "Si no se puede probar en pocos segundos, no esta listo para publicarse.",
  },
  {
    name: "Complejidad util",
    detail: "La capa visual y tecnica debe ayudar a entender, no esconder la idea principal.",
  },
  {
    name: "Evolucion constante",
    detail: "Cada entrega abre la siguiente fase: feedback, ajustes y nueva publicacion.",
  },
  {
    name: "Colaboracion real",
    detail: "Se priorizan personas y proyectos con ganas de iterar en publico.",
  },
];

const studioRhythm = [
  { phase: "Semillas", focus: "Definir idea central", output: "Hipotesis y referencia visual" },
  { phase: "Prototipo", focus: "Construir version jugable", output: "Demo util en pocos pasos" },
  { phase: "Iteracion", focus: "Ajustar con feedback", output: "Mejoras en claridad y ritmo" },
  { phase: "Publicacion", focus: "Abrir al ecosistema", output: "Entrada en colecciones activas" },
];

export default function AcercaPage() {
  return (
    <SiteShell currentPath="/acerca">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Acerca del estudio</span>
          <h1 className="root-title">Que es CodevaMP y por que existe</h1>
          <p className="root-subtitle">
            Este estudio existe para convertir ideas en experiencias tocables. No vendemos humo: se entra, se entiende y
            se prueba.
          </p>
          <div className="story-arc" aria-label="Recorrido narrativo principal">
            <Link href="/acerca" prefetch className="story-arc__item is-active">1. Acerca</Link>
            <Link href="/explorar" prefetch className="story-arc__item">2. Explorar</Link>
            <Link href="/proyectos" prefetch className="story-arc__item">3. Proyectos</Link>
          </div>
          <div className="story-intro-strip" aria-label="Resumen rapido del estudio">
            <article className="story-intro-item">
              <strong>Rol</strong>
              <span>Laboratorio creativo-tecnico</span>
            </article>
            <article className="story-intro-item">
              <strong>Formato</strong>
              <span>Prototipos, piezas y colecciones</span>
            </article>
            <article className="story-intro-item">
              <strong>Objetivo</strong>
              <span>Que la comunidad explore y participe</span>
            </article>
          </div>
          <div className="root-actions">
            <Link href="/explorar" prefetch className="root-action-button">
              Ver recorrido activo
            </Link>
            <Link href="/estrategia" prefetch className="root-action-button root-action-button--ghost">
              Plan de valor y B Corp
            </Link>
            <a
              href="https://www.youtube.com/@CodevaMPStudio"
              target="_blank"
              rel="noreferrer"
              className="root-action-button root-action-button--ghost"
            >
              Ver proceso en video
            </a>
          </div>
        </header>

        <section className="root-section story-section" aria-labelledby="acerca-capitulos">
          <div className="root-section-header">
            <p className="root-kicker">Acto I - Contexto</p>
            <h2 id="acerca-capitulos">La historia en 4 capitulos</h2>
            <p>Si llegas por primera vez, esta secuencia te da contexto en menos de un minuto.</p>
          </div>
          <div className="story-chapter-grid">
            {milestones.map((milestone) => (
              <article key={milestone.chapter} className="root-card story-chapter-card">
                <span className="story-chapter-index">{milestone.chapter}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section story-section" aria-labelledby="acerca-principios">
          <div className="root-section-header">
            <p className="root-kicker">Acto II - Criterio</p>
            <h2 id="acerca-principios">Principios que usamos para decidir</h2>
            <p>Cuando hay dudas, estas reglas determinan que se construye y que se descarta.</p>
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

        <section className="root-section story-section" aria-labelledby="acerca-ritmo">
          <div className="root-section-header">
            <p className="root-kicker">Acto III - Ejecucion</p>
            <h2 id="acerca-ritmo">Como pasa una idea de cero a publicacion</h2>
            <p>Cada fase termina con una salida concreta, para que el avance sea visible y medible.</p>
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

        <section className="root-section story-section">
          <div className="root-split">
            <div>
              <h2>Tu siguiente paso</h2>
              <p>Si ya tienes contexto del estudio, continua al mapa de experiencia para ver que esta activo hoy.</p>
            </div>
            <Link href="/explorar" prefetch className="root-action-button">Continuar a Explorar</Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
