import SiteShell from "@/app/components/site-shell";

const donationOptions = [
  {
    name: "PayPal",
    link: "https://paypal.me/codevamp",
    description: "Donaciones únicas o recurrentes con procesamiento internacional seguro.",
    perks: ["Apareces en el muro de agradecimientos", "Acceso anticipado a votaciones de proyectos"],
  },
  {
    name: "Ko-fi",
    link: "https://ko-fi.com/codevamp",
    description: "Apoyos rápidos a modo de “café digital” para financiar arte y producción audiovisual.",
    perks: ["Stickers digitales exclusivos", "Canal privado en Discord para feedback"],
  },
  {
    name: "Patreon",
    link: "https://patreon.com/codevamp",
    description: "Suscripción mensual con beneficios escalables y reportes detallados de uso.",
    perks: ["Mentorías grupales mensuales", "Plantillas y overlays descargables"],
  },
];

const transparency = [
  {
    label: "Premios y torneos",
    percentage: "45%",
    detail: "Se destinan a bolsas de premios, arbitrajes y pago a casters invitados.",
  },
  {
    label: "Producción y software",
    percentage: "30%",
    detail: "Herramientas audiovisuales, licencias de música y mantenimiento de bots.",
  },
  {
    label: "Educación y coaching",
    percentage: "15%",
    detail: "Honorarios para invitados, materiales de estudio y análisis especializados.",
  },
  {
    label: "Fondos de emergencia",
    percentage: "10%",
    detail: "Reserva para cubrir imprevistos técnicos o apoyar a miembros en situaciones críticas.",
  },
];

export default function DonacionesPage() {
  return (
    <SiteShell currentPath="/donaciones" accent="emerald">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          Apoyo a la comunidad
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Cada aporte se transforma en experiencias para todos</h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Tu ayuda sostiene torneos, infraestructura técnica y programas educativos. Mantenemos transparencia total para que sepas cómo utilizamos cada contribución.
        </p>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Formas de apoyar</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {donationOptions.map((option) => (
            <a
              key={option.name}
              href={option.link}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-400/40 hover:bg-white/10"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{option.name}</h3>
                <p className="mt-2 text-sm text-zinc-300">{option.description}</p>
                <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                  {option.perks.map((perk) => (
                    <li key={perk} className="rounded-2xl border border-white/10 bg-white/5 p-2">
                      ✅ {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition group-hover:translate-x-1">
                Donar ahora
                <span aria-hidden>↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Transparencia financiera</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Publicamos reportes trimestrales con recibos y resumen de gastos. Aquí tienes la distribución promedio de fondos.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {transparency.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">{item.label}</h3>
                <span className="text-sm font-semibold text-emerald-200">{item.percentage}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">¿No puedes donar?</h2>
        <p className="text-sm text-zinc-300">
          También puedes apoyar compartiendo contenido, moderando el chat o participando activamente en torneos y eventos. Todo gesto suma.
        </p>
        <p className="text-sm text-zinc-300">
          Escríbenos a <a href="mailto:hola@codevamp.gg" className="text-emerald-200 underline">hola@codevamp.gg</a> para proponer colaboraciones o ideas.
        </p>
      </section>
    </SiteShell>
  );
}
