import SiteShell from "@/app/components/site-shell";

const legalSections = [
  {
    title: "Aviso legal",
    content:
      "CodevaMP Studio es un laboratorio creativo dedicado a sistemas interactivos, arte digital y experiencias explorables.",
  },
  {
    title: "Politica de privacidad",
    content:
      "Solo recopilamos datos cuando es necesario para coordinar convocatorias o colaboraciones. Puedes solicitar la eliminacion de tu informacion en cualquier momento.",
  },
  {
    title: "Condiciones de uso",
    content:
      "Al interactuar con nuestras piezas aceptas un uso respetuoso y la autoria de cada creador. La redistribucion sin permiso no esta permitida.",
  },
];

const compliance = [
  {
    heading: "Propiedad intelectual",
    detail:
      "Cada proyecto mantiene los creditos de su autor o autora. Las colecciones solo exhiben material con permiso explicito.",
  },
  {
    heading: "Uso de imagen y documentacion",
    detail:
      "Al enviar una pieza para curaduria autorizas su exhibicion en el laboratorio y en materiales promocionales del estudio.",
  },
  {
    heading: "Contacto y soporte",
    detail:
      "Si detectas un problema con una pieza o necesitas retirar material, escribe por nuestros canales oficiales.",
  },
];

export default function LegalPage() {
  return (
    <SiteShell currentPath="/legal">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Legal y confianza</span>
          <h1 className="root-title">Reglas claras para un laboratorio abierto</h1>
          <p className="root-subtitle">
            Queremos construir un espacio seguro para la exploracion creativa. Estas politicas mantienen el cuidado y la
            transparencia del estudio.
          </p>
        </header>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Documentos principales</h2>
          </div>
          <div className="root-grid root-grid--three">
            {legalSections.map((section) => (
              <article key={section.title} className="root-card root-card--compact">
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <h2>Compromisos adicionales</h2>
            <p>
            Estas pautas complementan las condiciones de uso y se actualizan conforme el laboratorio crece.
            </p>
          </div>
          <ul className="root-list-block">
            {compliance.map((item) => (
              <li key={item.heading}>
                <h3>{item.heading}</h3>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="root-section">
          <div className="root-split">
            <div>
              <h2>Canales oficiales</h2>
              <p>Puedes escribirnos por WhatsApp o YouTube para soporte y solicitudes formales.</p>
            </div>
            <a
              href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Contactar soporte
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
