import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const explorables = [
  {
    title: "Mapa de resonancias",
    type: "Interfaz experimental",
    status: "En vivo",
    detail: "Cartografia interactiva que responde al ritmo de quien explora.",
  },
  {
    title: "Jardin modular",
    type: "Objeto digital",
    status: "Iteracion",
    detail: "Sistema de piezas que crece por visitas y guarda memoria visual.",
  },
  {
    title: "Loop-lab",
    type: "Experiencia sonora",
    status: "Laboratorio",
    detail: "Micro-bucles de sonido y visuales tratados como materiales vivos.",
  },
  {
    title: "Pasillo de sombras",
    type: "Prototipo jugable",
    status: "En construccion",
    detail: "Experiencia breve para jugar con luz, direccion y presencia.",
  },
  {
    title: "Archivo vivo",
    type: "Coleccion abierta",
    status: "Curaduria",
    detail: "Trabajos invitados: animacion, arte interactivo y piezas hibridas.",
  },
  {
    title: "Ventanas habitables",
    type: "Herramienta creativa",
    status: "Borrador",
    detail: "Sistema para crear interfaces que respiran y se reordenan.",
  },
];

const explorationRules = [
  {
    title: "Entra sin mapa fijo",
    detail: "Cada exploracion revela rutas nuevas. Deja que el sistema te guie.",
  },
  {
    title: "Interaccion antes que lectura",
    detail: "Toca, arrastra, escucha y cambia estados. Ahi esta la historia.",
  },
  {
    title: "Comparte lo inesperado",
    detail: "Los hallazgos de otros ayudan a desbloquear nuevas capas del laboratorio.",
  },
];

export default function ExplorarPage() {
  return (
    <SiteShell currentPath="/explorar">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Exploracion activa</span>
          <h1 className="root-title">Explorar significa entrar, probar y descubrir rutas</h1>
          <p className="root-subtitle">
            Esta pagina es la puerta de entrada al laboratorio. En lugar de leer mucho, eliges una pieza y empiezas a
            interactuar.
          </p>
          <div className="story-arc" aria-label="Recorrido narrativo principal">
            <Link href="/acerca" prefetch className="story-arc__item is-done">1. Acerca</Link>
            <Link href="/explorar" prefetch className="story-arc__item is-active">2. Explorar</Link>
            <Link href="/dev" prefetch className="story-arc__item">3. Dev</Link>
          </div>
          <div className="story-intro-strip" aria-label="Resumen rapido de explorar">
            <article className="story-intro-item">
              <strong>1. Entrar</strong>
              <span>Elige una pieza activa</span>
            </article>
            <article className="story-intro-item">
              <strong>2. Probar</strong>
              <span>Interactua y observa cambios</span>
            </article>
            <article className="story-intro-item">
              <strong>3. Compartir</strong>
              <span>Deja hallazgos para la comunidad</span>
            </article>
          </div>
          <div className="root-actions">
            <Link href="/dev" prefetch className="root-action-button">
              Entrar a Dev
            </Link>
            <Link href="/visuales" prefetch className="root-action-button root-action-button--ghost">
              Ir a la comunidad Visuales
            </Link>
          </div>
        </header>

        <section className="root-section story-section" aria-labelledby="mapa">
          <div className="root-section-header">
            <p className="root-kicker">Acto I - Escena</p>
            <h2 id="mapa">Que puedes tocar hoy</h2>
            <p>Cada pieza tiene estado y tipo para que sepas por donde empezar.</p>
          </div>
          <div className="root-grid root-grid--three">
            {explorables.map((item) => (
              <article key={item.title} className="root-card root-card--compact">
                <div className="root-card-head">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="root-card-meta">{item.type}</p>
                  </div>
                  <span className="root-pill">{item.status}</span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section story-section" aria-labelledby="como-explorar">
          <div className="root-section-header">
            <p className="root-kicker">Acto II - Metodo</p>
            <h2 id="como-explorar">Modo de uso en tres reglas</h2>
            <p>Este flujo evita perderse: una accion clara por paso.</p>
          </div>
          <div className="root-grid root-grid--three">
            {explorationRules.map((rule) => (
              <article key={rule.title} className="root-card root-card--compact">
                <h3>{rule.title}</h3>
                <p>{rule.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section story-section">
          <div className="root-split">
            <div>
              <h2>Acto III - Transicion</h2>
              <p>Cuando ya exploraste, el siguiente paso logico es entrar a Dev para ver que productos siguen activos.</p>
            </div>
            <Link href="/dev" prefetch className="root-action-button">Continuar a Dev</Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
