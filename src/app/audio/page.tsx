import SiteShell from "@/app/components/site-shell";

const audioLines = [
  {
    title: "Texturas sonoras",
    detail: "Capas ambientales y ritmos modulares para experiencias inmersivas.",
  },
  {
    title: "Laboratorio de voz",
    detail: "Exploraciones entre narrativa breve, IA de voz y diseño de presencia.",
  },
  {
    title: "Escenas reactivas",
    detail: "Sistemas donde audio y visual responden al comportamiento del usuario.",
  },
];

const roadmap = [
  {
    phase: "Q1",
    focus: "Prototipo de estudio sonoro",
    status: "En desarrollo",
  },
  {
    phase: "Q2",
    focus: "Publicacion de primeros experimentos",
    status: "Planificado",
  },
  {
    phase: "Q3",
    focus: "Convocatoria abierta de colaboraciones",
    status: "Pendiente",
  },
];

export default function AudioPage() {
  return (
    <SiteShell currentPath="/audio">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">CodevaMP Audio</span>
          <h1 className="root-title">Canal sonoro en construccion</h1>
          <p className="root-subtitle">
            Esta unidad estara enfocada en experiencias de audio interactivas. Por ahora estamos preparando la base tecnica
            y curatorial para lanzarla con calidad premium.
          </p>
        </header>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Lineas de trabajo</h2>
          </div>
          <div className="root-grid root-grid--three">
            {audioLines.map((item) => (
              <article key={item.title} className="root-card root-card--compact">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Roadmap inicial</h2>
          </div>
          <div className="root-grid root-grid--three">
            {roadmap.map((item) => (
              <article key={item.phase} className="root-card root-card--compact">
                <span className="root-kicker">{item.phase}</span>
                <h3>{item.focus}</h3>
                <p>{item.status}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
