import Link from "next/link";

import MobileLegendsPicker from "@/app/components/mobile-legends-picker";
import SiteShell from "@/app/components/site-shell";
import { mlbbHeroTutorials } from "@/app/data/mobile-legends-hero-tutorials";
import { mlbbPatchHistory } from "@/app/data/mobile-legends-patch-history";

const statBadges = [
  {
    label: "Scrims semanales",
    detail: "Lunes, miércoles y viernes con análisis en vivo",
  },
  {
    label: "Más de 60 héroes",
    detail: "Base actualizada con métricas competitivas",
  },
  {
    label: "Planner descargable",
    detail: "Incluye rutas de bans y builds reactivos",
  },
];

const workflowStages = [
  {
    title: "1. Scouting y veto",
    description:
      "Identifica amenazas clave, prepara bans condicionados y anticipa composiciones populares del parche.",
  },
  {
    title: "2. Draft asistido",
    description:
      "Usa el picker para evaluar sinergias, contras y balance macro antes de bloquear tu pick decisivo.",
  },
  {
    title: "3. Plan de ejecución",
    description:
      "Genera rutinas de práctica, objetivos por minuto y chequeos de comunicación para scrims y ranked.",
  },
];

const practiseBeats = [
  {
    label: "Lunes · Macro review",
    description: "VOD review y ajustes de rotaciones con el equipo.",
  },
  {
    label: "Miércoles · Scrims oficiales",
    description: "Drafts guiados + simulaciones del picker en tiempo real.",
  },
  {
    label: "Viernes · Road to Mythic",
    description: "Entrenamientos individuales por rol con métricas comparativas.",
  },
  {
    label: "Domingo · Laboratorio abierto",
    description: "Sesión comunitaria para probar composiciones off-meta.",
  },
];

const highlightPatches = mlbbPatchHistory.slice(0, 3);
const featuredTutorials = mlbbHeroTutorials.slice(0, 6);

export default function MobileLegendsLabPage() {
  return (
    <SiteShell currentPath="/juegos/mobile-legends" accent="emerald">
      <header className="space-y-8 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900/60 via-slate-900/80 to-cyan-900/60 p-10 text-sm text-emerald-100">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
            Laboratorio táctico · MLBB
          </span>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Domina Mobile Legends con el nuevo picker estratégico
          </h1>
          <p className="text-base text-emerald-100/90 sm:max-w-3xl">
            Coordina drafts en segundos, detecta huecos en la composición rival y obtén un plan listo para ejecutar. Esta
            página concentra todo el ecosistema MLBB de CodevaMP: scrims, guías, parches y la app inteligente que te
            acompaña en cada fase del juego.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="https://discord.gg/codevamp"
              prefetch={false}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2 font-semibold text-black shadow-md transition hover:scale-[1.02]"
            >
              Unirme a scrims MLBB
              <span aria-hidden>↗</span>
            </Link>
            <Link
              href="/juegos"
              prefetch
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 font-semibold text-white transition hover:border-emerald-400/60 hover:text-emerald-100"
            >
              Volver al hub de juegos
            </Link>
          </div>
        </div>

        <div className="grid gap-4 text-xs text-emerald-100 sm:grid-cols-3">
          {statBadges.map((badge) => (
            <div key={badge.label} className="rounded-2xl border border-emerald-400/40 bg-emerald-400/5 p-4">
              <span className="text-sm font-semibold text-white">{badge.label}</span>
              <p className="mt-1 text-emerald-100/80">{badge.detail}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
            Flujo recomendado
          </span>
          <h2 className="text-2xl font-semibold text-white">Planifica tu semana alrededor del picker</h2>
          <p className="text-sm text-zinc-300">
            Sigue estas tres etapas para obtener resultados consistentes: scouting previo, draft asistido y ejecución
            medida. Cada bloque enlaza con recursos y sesiones del laboratorio para que no entrenes en solitario.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflowStages.map((stage) => (
            <div key={stage.title} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6">
              <span className="text-sm font-semibold text-white">{stage.title}</span>
              <p className="text-xs text-zinc-300">{stage.description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-emerald-900/70 to-cyan-900/70 p-6 text-xs text-emerald-100 md:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Sesiones guiadas de práctica</h3>
            <p className="text-emerald-100/90">
              Integra el picker en cada bloque de entrenamiento. Ajustamos los ejercicios según parches, feedback experto y
              métricas del agente táctico descargable.
            </p>
            <ul className="space-y-3">
              {practiseBeats.map((item) => (
                <li key={item.label} className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
                  <span className="block text-sm font-semibold text-white">{item.label}</span>
                  <span className="text-emerald-100/80">{item.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="space-y-2 text-xs text-emerald-100/80">
              <span className="text-[11px] uppercase tracking-wide text-emerald-200">¿Cómo usar la herramienta?</span>
              <p>
                Añade los picks confirmados de cada bando, marca los rasgos de la comp enemiga y deja que el algoritmo sugiera
                héroes priorizando sinergia y plan macro. Guarda las recomendaciones antes de la partida para comparar con el
                resultado final.
              </p>
            </div>
            <div className="space-y-2 text-xs text-emerald-100/70">
              <span className="text-[11px] uppercase tracking-wide text-emerald-200">Tip rápido</span>
              <p>
                Si cambias de rol entre scrims, duplica la sesión con el estado guardado para reutilizar la información sin
                partir de cero.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <MobileLegendsPicker />
      </section>

      <section className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            Guías destacadas
          </span>
          <h2 className="text-2xl font-semibold text-white">Aprende héroes meta antes de las scrims</h2>
          <p className="text-sm text-zinc-300">
            Seleccionamos tutoriales actualizados con builds, combos y checklists para roles prioritarios. Úsalos como apoyo
            cuando el picker recomiende un héroe que quieras dominar.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {featuredTutorials.map((tutorial) => (
            <article
              key={`${tutorial.hero}-${tutorial.format}`}
              className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-zinc-300"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3 text-sm text-white">
                  <div>
                    <h3 className="text-base font-semibold">{tutorial.hero}</h3>
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                      {tutorial.role} · {tutorial.lane}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100">
                    {tutorial.difficulty}
                  </span>
                </div>
                <p>{tutorial.summary}</p>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
                  {tutorial.focus.map((topic) => (
                    <span key={`${tutorial.hero}-${topic}`} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-400">
                  <span>
                    {tutorial.duration} · {tutorial.format}
                  </span>
                  <span>Actualizado {tutorial.lastUpdate}</span>
                </div>
                <Link
                  href={tutorial.url}
                  prefetch={false}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-400/25"
                >
                  Abrir recurso
                  <span aria-hidden>↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
            Historial competitivo
          </span>
          <h2 className="text-2xl font-semibold text-white">Cambios recientes del meta</h2>
          <p className="text-sm text-zinc-300">
            Resume los parches más influyentes para ajustar tus estrategias y justificar picks arriesgados durante draft.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {highlightPatches.map((patch) => (
            <article
              key={patch.version}
              className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-zinc-300"
            >
              <header className="space-y-1 text-white">
                <h3 className="text-lg font-semibold">Parche {patch.version}</h3>
                <p className="text-[11px] uppercase tracking-wide text-violet-200">{patch.date}</p>
              </header>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
                {patch.theme}
              </span>
              <ul className="space-y-2 text-[11px]">
                {patch.highlights.map((highlight) => (
                  <li key={`${patch.version}-${highlight}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-xs text-zinc-300">
          <p>
            ¿Necesitas el historial completo? Visita la sección de Mobile Legends dentro del hub de juegos para consultar
            todos los parches desde 2016 y descargar fichas adicionales.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
