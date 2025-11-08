import Link from "next/link";
import SiteShell from "./components/site-shell";

const focusAreas = [
  {
    title: "Desarrollo y apps",
    description:
      "Construimos herramientas propias para la comunidad. Praxis —la misma app que estamos lanzando como nuevo proyecto— centraliza scrims, feedback y dashboards para equipos.",
    points: [
      "Diseño UX enfocado en jugadores y staff técnico.",
      "Integraciones con Discord y paneles de control en tiempo real.",
      "Iteraciones abiertas con la comunidad para validar cada release.",
    ],
    cta: { label: "Ver hoja de ruta", href: "/proyectos" },
  },
  {
    title: "Mobile Legends: Bang Bang",
    description:
      "Todo el contenido competitivo gira alrededor de MLBB: guías, drafts, análisis de parches y entrenamientos comunitarios.",
    points: [
      "Laboratorio con builds actualizadas y macros por rol.",
      "Sparrings semanales y revisión de partidas grabadas.",
      "Recursos descargables para clubes y equipos universitarios.",
    ],
    cta: { label: "Entrar al laboratorio MLBB", href: "/juegos/mobile-legends" },
  },
];

const mlbbResources = [
  {
    title: "Inicio rápido",
    detail: "Checklist y configuraciones recomendadas para aterrizar en el meta actual sin perder tiempo.",
  },
  {
    title: "Playbook de roles",
    detail: "Macro, rotaciones y timings para jungla, roam, gold y exp lane en un formato fácil de consultar.",
  },
  {
    title: "Drafts guiados",
    detail: "Plantillas y ban priorities que usamos en scrims para acelerar el proceso de pick/ban.",
  },
];

const communityChannels = [
  {
    href: "https://youtube.com/@CodevaMPYT",
    label: "YouTube",
    sub: "VODs, análisis de parches y devlogs de Praxis",
    emoji: "▶️",
  },
  {
    href: "https://twitch.tv/codevamp",
    label: "Twitch",
    sub: "Streams de desarrollo y sesiones MLBB",
    emoji: "🎥",
  },
  {
    href: "https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT",
    label: "WhatsApp",
    sub: "Alertas rápidas y coordinación de scrims",
    emoji: "💬",
  },
  {
    href: "https://discord.gg/codevamp",
    label: "Discord",
    sub: "Canales tácticos, feedback y votaciones de features",
    emoji: "🧠",
  },
];

export default function Page() {
  return (
    <SiteShell currentPath="/" accent="violet">
      <header className="grid gap-10 py-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-zinc-200">
            CodevaMP · Comunidad creadora
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Dos frentes, un mismo objetivo: construir herramientas y dominar Mobile Legends.
          </h1>
          <p className="text-base text-zinc-300 sm:text-lg">
            Estamos concentrados en desarrollo y MLBB. Praxis, nuestra app principal en progreso, evoluciona con la misma visión que el nuevo proyecto para la comunidad: todo lo demás queda en pausa para mantener el enfoque.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/proyectos"
              prefetch
              className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
            >
              Revisar progreso de Praxis
            </Link>
            <Link
              href="/juegos/mobile-legends"
              prefetch
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
            >
              Entrar al laboratorio MLBB
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200 shadow-2xl">
          <div>
            <h2 className="text-lg font-semibold text-white">Resumen rápido</h2>
            <p className="mt-2 text-xs uppercase tracking-wide text-fuchsia-200/80">Actualizado semanalmente</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white">Praxis = Nuevo proyecto</h3>
              <p className="mt-1 text-xs text-zinc-300">
                Consolidamos todo el roadmap en una sola app. Las versiones previas pasan a llamarse Praxis y recibirán las mismas features.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white">Foco competitivo</h3>
              <p className="mt-1 text-xs text-zinc-300">
                Solo trabajamos Mobile Legends. No habrá nuevos juegos de aim ni experimentos paralelos hasta terminar las herramientas clave.
              </p>
            </div>
          </div>
          <Link
            href="/acerca"
            prefetch
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold transition hover:border-white/40 hover:text-white"
          >
            Conoce la visión completa ↗
          </Link>
        </div>
      </header>

      <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8" aria-labelledby="areas-clave">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/80">Ejes actuales</p>
          <h2 id="areas-clave" className="text-2xl font-semibold text-white">
            Qué estamos construyendo ahora mismo
          </h2>
          <p className="max-w-2xl text-sm text-zinc-300">
            Separar el contenido en bloques claros nos ayuda a mantener entregables cortos y visibles, tanto para desarrollo como para MLBB.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {focusAreas.map((area) => (
            <div key={area.title} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{area.title}</h3>
                <p className="text-sm text-zinc-300">{area.description}</p>
              </div>
              <ul className="space-y-2 text-sm text-zinc-200">
                {area.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="mt-1 text-fuchsia-200">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div>
                <Link
                  href={area.cta.href}
                  prefetch
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold transition hover:border-white/40 hover:text-white"
                >
                  {area.cta.label} ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 lg:grid-cols-[1.1fr,0.9fr]" aria-labelledby="mlbb-recursos">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/80">Mobile Legends</p>
          <h2 id="mlbb-recursos" className="text-2xl font-semibold text-white">
            Recursos esenciales del laboratorio MLBB
          </h2>
          <p className="text-sm text-zinc-300">
            Todo el material se ajusta a parches actuales y se edita desde la experiencia competitiva de la comunidad.
          </p>
          <Link
            href="/juegos/mobile-legends"
            prefetch
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
          >
            Ver índice completo ↗
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {mlbbResources.map((resource) => (
            <div key={resource.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{resource.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8" aria-labelledby="comunidad">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Conexiones directas</p>
          <h2 id="comunidad" className="text-2xl font-semibold text-white">
            Mantente al día y comparte feedback
          </h2>
          <p className="max-w-2xl text-sm text-zinc-300">
            Los canales oficiales se enfocan en construcción de la app y estrategias MLBB. Únete al que mejor se adapte a tu flujo.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {communityChannels.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-fuchsia-400/40 hover:bg-white/10"
            >
              <span className="text-2xl">{link.emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-white">{link.label}</div>
                <div className="text-xs text-zinc-300">{link.sub}</div>
              </div>
              <span className="opacity-50 transition group-hover:opacity-100">↗</span>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}