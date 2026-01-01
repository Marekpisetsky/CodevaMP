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
      <header className="space-y-6">
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Apoyo al laboratorio
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Cada aporte abre nuevas exploraciones</h1>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Tu apoyo sostiene la creacion de sistemas interactivos, piezas artisticas y colecciones abiertas. Todo se invierte
          en el crecimiento del universo CodevaMP Studio.
        </p>
      </header>

      <section className="mt-12 grid gap-6">
        <h2 className="text-2xl font-semibold text-white">Formas de apoyar</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {donationOptions.map((option) => (
            <a
              key={option.name}
              href={option.link}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col justify-between border-t border-white/10 pt-6 transition hover:border-white/40"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{option.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{option.description}</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  {option.perks.map((perk) => (
                    <li key={perk} className="border-l border-white/10 pl-3">
                      - {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition group-hover:translate-x-1">
                Apoyar ahora -
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Transparencia</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Compartimos como usamos los aportes para mantener el laboratorio activo y abierto.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {transparency.map((item) => (
            <div key={item.label} className="border-t border-white/10 pt-6">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                <span className="text-sm font-semibold text-emerald-200">{item.percentage}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4">
        <h2 className="text-2xl font-semibold text-white">Otra forma de apoyar</h2>
        <p className="text-sm text-slate-300">
          Comparte proyectos, sugiere piezas o difunde el laboratorio. La energia colectiva mantiene vivo el universo.
        </p>
      </section>
    </SiteShell>
  );
}
