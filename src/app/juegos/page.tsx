import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const featuredLabs = [
  {
    title: "Mobile Legends · Laboratorio táctico",
    summary:
      "Draft planner interactivo, análisis de parches y calendario de scrims. Incluye el nuevo Mobile Legends Picker mejorado.",
    href: "/juegos/mobile-legends",
    tag: "Actualizado",
  },
  {
    title: "FPS & Aim Trainers",
    summary:
      "Sesiones de micro-mecánicas para Valorant y Call of Duty: planificaciones de tiro, warmups y configuraciones sugeridas.",
    href: "#fps",
    tag: "En desarrollo",
  },
  {
    title: "Aventura & RPG",
    summary:
      "Guías narrativas, rutas de farmeo y builds para juegos de mundo abierto. Ideal para streams colaborativos.",
    href: "#aventura",
    tag: "Beta",
  },
];

const scrimCalendar = [
  { day: "Lunes", focus: "Valorant 5-stack", format: "Best of 3", slots: "8 equipos" },
  { day: "Miércoles", focus: "Mobile Legends scrims", format: "Bo2 con desempate", slots: "12 equipos" },
  { day: "Sábado", focus: "Ligas comunitarias", format: "Bracket suizo", slots: "16 equipos" },
];

export default function JuegosPage() {
  return (
    <SiteShell currentPath="/juegos" accent="emerald">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          Juegos & Labs
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Entrena con herramientas diseñadas para cada título y rol
        </h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Esta sección agrupa todas las experiencias tácticas de CodevaMP. Encontrarás pizarras de draft, planillas de scrims, recursos descargables y guías paso a paso para Mobile Legends, shooters competitivos y aventuras cooperativas.
        </p>
        <Link
          href="/juegos/mobile-legends"
          prefetch
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
        >
          Abrir el laboratorio de MLBB
        </Link>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Laboratorios destacados</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {featuredLabs.map((lab) => (
            <Link
              key={lab.title}
              href={lab.href.startsWith("#") ? lab.href : lab.href}
              prefetch={!lab.href.startsWith("#")}
              className="group flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10"
            >
              <div>
                <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                  {lab.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{lab.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{lab.summary}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition group-hover:translate-x-1">
                Explorar
                <span aria-hidden>↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="fps" className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Zona FPS & Aim</h2>
            <p className="text-sm text-zinc-300">
              Plan de entrenamiento progresivo con VOD review, drills diarios y hojas de seguimiento para mejorar aim, game sense y comunicación.
            </p>
          </div>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            Actualización próxima
          </span>
        </div>
        <ul className="grid gap-3 text-sm text-zinc-300">
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            🎯 Paquetes de práctica Aim Lab & KovaaK con objetivos diarios y seguimiento por niveles.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            🗺️ Estrategias de ejecución en mapas meta con callouts en español y roles sugeridos.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            🎙️ Scripts de comunicación para IGLs y recursos de VOD review colaborativa.
          </li>
        </ul>
      </section>

      <section id="aventura" className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Aventura & RPG</h2>
            <p className="text-sm text-zinc-300">
              Documentación para streams narrativos: listas de misiones, rutas de farmeo, builds cooperativas y herramientas para involucrar a la audiencia en decisiones clave.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
            Beta abierta
          </span>
        </div>
        <ul className="grid gap-3 text-sm text-zinc-300">
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            🧭 Mapas interactivos con rutas optimizadas para juegos de mundo abierto populares.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            💬 Encuestas y scripts para que la comunidad tome decisiones durante los streams.
          </li>
          <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
            🤝 Plantillas de cooperativo para definir roles, inventario y progresión compartida.
          </li>
        </ul>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Calendario de scrims y ligas</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Todos los cupos se gestionan en Discord con prioridad para miembros activos y equipos que cumplan los requisitos de fair play.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-zinc-300">
            <thead className="bg-white/10 text-xs uppercase tracking-wide text-zinc-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Día</th>
                <th scope="col" className="px-4 py-3 text-left">Enfoque</th>
                <th scope="col" className="px-4 py-3 text-left">Formato</th>
                <th scope="col" className="px-4 py-3 text-left">Cupos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {scrimCalendar.map((session) => (
                <tr key={session.day} className="bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{session.day}</td>
                  <td className="px-4 py-3">{session.focus}</td>
                  <td className="px-4 py-3">{session.format}</td>
                  <td className="px-4 py-3 text-emerald-200">{session.slots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Solicita acceso anticipado</h2>
            <p className="text-sm text-zinc-300">
              ¿Quieres probar herramientas antes del lanzamiento o colaborar con tu experiencia profesional? Déjanos tus datos y agenda una llamada rápida.
            </p>
          </div>
          <Link
            href="https://forms.gle/8S1fWLj3QA"
            prefetch={false}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Enviar solicitud
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
