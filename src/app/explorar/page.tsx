import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const explorables = [
  {
    title: "Mapa de resonancias",
    type: "Interfaz experimental",
    status: "En vivo",
    detail: "Una cartografia interactiva que cambia segun tu ritmo de exploracion.",
  },
  {
    title: "Jardin modular",
    type: "Objeto digital",
    status: "Iteracion",
    detail: "Un sistema de piezas que crece con cada visita y guarda memoria visual.",
  },
  {
    title: "Loop-lab",
    type: "Experiencia sonora",
    status: "Laboratorio",
    detail: "Explora micro-bucles de sonido y visuales como si fueran materiales fisicos.",
  },
  {
    title: "Pasillo de sombras",
    type: "Prototipo jugable",
    status: "En construccion",
    detail: "Una experiencia breve para jugar con luz, direccion y presencia.",
  },
  {
    title: "Archivo vivo",
    type: "Coleccion abierta",
    status: "Curaduria",
    detail: "Trabajos de otras personas: animacion, arte interactivo y piezas hibridas.",
  },
  {
    title: "Ventanas habitables",
    type: "Herramienta creativa",
    status: "Borrador",
    detail: "Un sistema para crear interfaces que respiran y se reordenan solas.",
  },
];

const explorationRules = [
  {
    title: "Entra sin mapa fijo",
    detail: "Cada exploracion revela rutas nuevas. Deja que el sistema te guie.",
  },
  {
    title: "Interaccion > lectura",
    detail: "Toca, arrastra, escucha, cambia estados. Ahi esta la historia.",
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
          <h1 className="root-title">Bienvenido al laboratorio: aqui todo se toca</h1>
          <p className="root-subtitle">
            Este no es un catalogo. Es un mapa de experiencias vivas. Las piezas cambian, se mezclan y se expanden cuando
            las exploras.
          </p>
          <div className="root-actions">
          <Link
            href="/proyectos"
            prefetch
            className="root-action-button"
          >
            Ver colecciones abiertas
          </Link>
          <a
            href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
            target="_blank"
            rel="noreferrer"
            className="root-action-button root-action-button--ghost"
          >
            Compartir proyecto
          </a>
        </div>
        </header>

        <section className="root-section" aria-labelledby="mapa">
          <div className="root-section-header">
            <p className="root-kicker">Mapa del laboratorio</p>
            <h2 id="mapa">Explorables en curso</h2>
            <p>
            Cada pieza tiene su propio ritmo. Algunas estan vivas, otras en construccion. Todas se pueden tocar.
            </p>
          </div>
          <div className="root-grid root-grid--three">
            {explorables.map((item) => (
              <article key={item.title} className="root-card root-card--compact">
                <div className="root-card-head">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="root-card-meta">{item.type}</p>
                  </div>
                  <span className="root-pill">
                    {item.status}
                  </span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section" aria-labelledby="como-explorar">
          <div className="root-section-header">
            <p className="root-kicker">Como explorar</p>
            <h2 id="como-explorar">Reglas minimas, maxima curiosidad</h2>
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

        <section className="root-section">
          <div className="root-split">
            <div>
              <h2>Abre una nueva puerta</h2>
              <p>
              Si tienes un proyecto o una pieza que quieras compartir, escribenos y lo sumamos a las colecciones vivas.
              </p>
            </div>
            <a
              href="https://www.youtube.com/@CodevaMPStudio"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Ver procesos en YouTube
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
