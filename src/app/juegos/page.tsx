import Link from "next/link";
import MobileLegendsPicker from "@/app/components/mobile-legends-picker";
import SiteShell from "@/app/components/site-shell";
import { mlbbPatchHistory } from "@/app/data/mobile-legends-patch-history";

const featuredLabs = [
  {
    title: "Mobile Legends · Laboratorio táctico",
    summary:
      "Draft planner interactivo, análisis de parches y calendario de scrims. Incluye el nuevo Mobile Legends Picker dentro de la sección.",
    href: "#mlbb",
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

const mlbbHighlights = [
  {
    title: "Parche 1.8.20 · Roles",
    detail:
      "Los tanques pierden su etiqueta de soporte y Nana queda como maga pura, obligando a replantear el peel del equipo.",
  },
  {
    title: "Parche 1.6.84 · Julian",
    detail:
      "El debut del Raven sin definitiva llega con ajustes a Irithel, Thamuz y Akai, más eventos especiales como Transformers y MSC.",
  },
  {
    title: "Parche 1.4.94 · Especialidades",
    detail:
      "Se añaden Magic/Mixed Damage, Guard y Support, redefiniendo builds de Bruno, Selena, Karina y compañía.",
  },
];

const mlbbSessions = [
  {
    label: "Lunes · Review",
    description: "VOD review grupal centrado en fase de líneas y macro decisiones tempranas.",
  },
  {
    label: "Miércoles · Scrims",
    description: "Prácticas contra equipos de nivel similar. Rotaciones y setups de objetivos en vivo.",
  },
  {
    label: "Viernes · Road to Mythic",
    description: "Coaching express por rol, ejercicios mecánicos y medición de progreso semanal.",
  },
  {
    label: "Domingo · Laboratorio abierto",
    description: "Sesión para testear picks off-meta, responder preguntas y compartir recursos.",
  },
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
          href="#mlbb"
          prefetch
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
        >
          Ir al laboratorio de MLBB
        </Link>
      </header>

      <section
        id="mlbb"
        className="mt-12 grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
              Mobile Legends · Bang Bang
            </span>
            <h2 className="text-2xl font-semibold text-white">
              Laboratorio MLBB: planifica drafts y ajusta tu estrategia
            </h2>
            <p className="text-sm text-zinc-300">
              Selecciona tu rol, identifica amenazas enemigas y coordina sinergias con tu escuadra. Todo el flujo de trabajo ahora vive dentro de Juegos, listo para usarse durante scrims o ranked.
            </p>
            <nav className="flex flex-wrap gap-2 text-xs">
              <a
                href="#mlbb-herramientas"
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/60 hover:bg-fuchsia-400/20"
              >
                Herramientas MLBB
              </a>
              <a
                href="#mlbb-agenda"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/20"
              >
                Agenda de práctica
              </a>
              <a
                href="#mlbb-parches"
                className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 font-semibold text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-400/20"
              >
                Historial de parches
              </a>
            </nav>
          </div>
          <div className="flex flex-col items-start gap-3 text-sm text-zinc-200">
            <Link
              href="https://discord.gg/codevamp"
              prefetch={false}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
            >
              Unirse a scrims MLBB
            </Link>
            <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
              Cobertura 1.8.20 · 1.6.84 · 1.4.94
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr] xl:items-start">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {mlbbHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
                </div>
              ))}
            </div>

            <section id="mlbb-agenda" className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">
                Rutina semanal recomendada
              </h3>
              <ul className="grid gap-3 text-sm text-zinc-300">
                {mlbbSessions.map((session) => (
                  <li
                    key={session.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <span className="block font-semibold text-white">
                      {session.label}
                    </span>
                    <span className="text-xs text-zinc-300">
                      {session.description}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section id="mlbb-herramientas" className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200">
                Herramientas MLBB
              </span>
              <h3 className="mt-4 text-xl font-semibold text-white">Selector táctico y planificador de picks</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Accede al Mobile Legends Picker renovado: ahora muestra puntuaciones comparativas, alertas de composición y un plan de juego listo para ejecutar durante tus partidas.
              </p>
            </div>

            <MobileLegendsPicker />
          </section>
        </div>

        <section
          id="mlbb-parches"
          className="mt-6 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
              Cronología MLBB
            </span>
            <h3 className="text-lg font-semibold text-white">
              Historial de parches clave
            </h3>
            <p className="text-sm text-zinc-300">
              Resumen curado de cambios de roles, especialidades y eventos desde 2016 hasta la versión 1.8.20 para contextualizar drafts y composiciones.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {mlbbPatchHistory.map((entry) => (
              <article
                key={entry.version}
                className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">
                      Parche {entry.version}
                    </h4>
                    <p className="text-xs uppercase tracking-wide text-violet-200">
                      {entry.date}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-100">
                    {entry.theme}
                  </span>
                </header>
                <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-300" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </section>

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
