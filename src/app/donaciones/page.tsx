import SiteShell from "@/app/components/site-shell";

const donationOptions = [
  {
    name: "PayPal",
    link: "https://paypal.me/codevamp",
    description: "Aportes puntuales o recurrentes para sostener nuevas piezas explorables.",
    perks: ["Actualizaciones anticipadas", "Participacion en pruebas privadas"],
  },
  {
    name: "Ko-fi",
    link: "https://ko-fi.com/codevamp",
    description: "Apoyo directo para produccion de arte, sonido y prototipos visuales.",
    perks: ["Bocetos del laboratorio", "Creditos en colecciones abiertas"],
  },
  {
    name: "Patreon",
    link: "https://patreon.com/codevamp",
    description: "Suscripcion para acompanar el ritmo del estudio y sus ciclos creativos.",
    perks: ["Acceso a experimentos semanales", "Sesiones de exploracion guiada"],
  },
];

const transparency = [
  {
    label: "Produccion creativa",
    percentage: "45%",
    detail: "Arte, animacion, sonido, prototipos interactivos y documentacion.",
  },
  {
    label: "Infraestructura",
    percentage: "30%",
    detail: "Hosting, herramientas de desarrollo, licencias y equipos.",
  },
  {
    label: "Colaboraciones",
    percentage: "15%",
    detail: "Honorarios para artistas invitados y apoyos a proyectos externos.",
  },
  {
    label: "Fondo exploratorio",
    percentage: "10%",
    detail: "Reserva para pruebas experimentales y piezas de riesgo creativo.",
  },
];

export default function DonacionesPage() {
  return (
    <SiteShell currentPath="/donaciones">
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Apoyo al laboratorio</span>
          <h1 className="root-title">Cada aporte abre nuevas exploraciones</h1>
          <p className="root-subtitle">
            Tu apoyo sostiene la creacion de sistemas interactivos, piezas artisticas y colecciones abiertas. Todo se
            invierte en el crecimiento del universo CodevaMP Studio.
          </p>
        </header>

        <section className="root-section">
          <div className="root-section-header">
            <h2>Formas de apoyar</h2>
          </div>
          <div className="root-grid root-grid--three">
            {donationOptions.map((option) => (
              <a
                key={option.name}
                href={option.link}
                target="_blank"
                rel="noreferrer"
                className="root-card root-card--link"
              >
                <h3>{option.name}</h3>
                <p>{option.description}</p>
                <ul className="root-list">
                  {option.perks.map((perk) => (
                    <li key={perk}>
                      <strong>Incluye</strong>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <span className="root-inline-accent">Apoyar ahora</span>
              </a>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <h2>Transparencia</h2>
            <p>
            Compartimos como usamos los aportes para mantener el laboratorio activo y abierto.
            </p>
          </div>
          <div className="root-grid root-grid--two">
            {transparency.map((item) => (
              <article key={item.label} className="root-card root-card--compact">
                <div className="root-card-head">
                  <h3>{item.label}</h3>
                  <span className="root-inline-accent">{item.percentage}</span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section">
          <div className="root-split">
            <div>
              <h2>Otra forma de apoyar</h2>
              <p>
                Comparte proyectos, sugiere piezas o difunde el laboratorio. La energia colectiva mantiene vivo el universo.
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
              target="_blank"
              rel="noreferrer"
              className="root-action-button"
            >
              Unirme a la comunidad
            </a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
