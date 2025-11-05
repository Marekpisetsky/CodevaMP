import Link from "next/link";
import SiteShell from "./components/site-shell";

const socialLinks = [
  { href: "https://youtube.com/@CodevaMPYT", label: "YouTube", sub: "Videos, retos y directos", emoji: "▶️" },
  { href: "https://twitch.tv/codevamp", label: "Twitch", sub: "Streams chill", emoji: "🎥" },
  { href: "https://kick.com/codevamp", label: "Kick", sub: "Directos alternos", emoji: "🟢" },
  { href: "https://www.tiktok.com/@codevamp_official", label: "TikTok", sub: "Clips y highlights", emoji: "🎶" },
  { href: "https://instagram.com/codevamp_official", label: "Instagram", sub: "Arte y previews", emoji: "📸" },
  { href: "https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT", label: "Comunidad WhatsApp", sub: "Únete al chat oficial", emoji: "💬" },
];

const quickSections = [
  {
    title: "Acerca de CodevaMP",
    description: "Conoce la historia, los valores y la misión que guía cada stream y torneo de la familia.",
    href: "/acerca",
    accent: "from-indigo-500/70 to-fuchsia-500/70",
  },
  {
    title: "Laboratorio de Juegos",
    description: "Estrategias, guías y tools dedicados a Mobile Legends y otros títulos competitivos.",
    href: "/juegos",
    accent: "from-emerald-500/70 to-cyan-500/70",
  },
  {
    title: "Proyectos en curso",
    description: "Series, cursos y ligas comunitarias con calendarios y requisitos claros para unirte.",
    href: "/proyectos",
    accent: "from-amber-500/70 to-rose-500/70",
  },
  {
    title: "Apoya la iniciativa",
    description: "Opciones transparentes de donación, patrocinios y cómo se usa cada aporte.",
    href: "/donaciones",
    accent: "from-fuchsia-500/70 to-purple-500/70",
  },
];

const agenda = [
  {
    title: "MLBB Scrims · Meta de la semana",
    detail: "Miércoles 21:00 GMT-5 — pruebas del nuevo parche con análisis de drafts en vivo.",
  },
  {
    title: "Jornadas Road to Mythic",
    detail: "Viernes 19:30 GMT-5 — coaching express para roles de jungla y roam.",
  },
  {
    title: "Community Chill Night",
    detail: "Domingo 17:00 GMT-5 — juegos party, sorteos y feedback del roadmap.",
  },
];

export default function Page() {
  return (
    <SiteShell currentPath="/" accent="violet">
      <header className="grid gap-8 py-12 lg:grid-cols-[1.25fr,0.95fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-zinc-200">
            Comunidad gamer latina
          </span>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Creemos experiencias colaborativas para aprender, competir y disfrutar los juegos que nos apasionan.
          </h1>
          <p className="text-base text-zinc-300 sm:text-lg">
            CodevaMP reúne talento latino con eventos, contenido educativo y herramientas tácticas. Explora las nuevas páginas dedicadas a cada área y accede a recursos profundos para subir de nivel junto a la familia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/juegos/mobile-legends"
              prefetch
              className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
            >
              Ir al laboratorio MLBB
            </Link>
            <Link
              href="/acerca"
              prefetch
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
            >
              Conoce la misión
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300 shadow-2xl">
          <h2 className="text-lg font-semibold text-white">Agenda destacada</h2>
          <ul className="mt-4 space-y-3">
            {agenda.map((item) => (
              <li key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="text-xs text-zinc-300">{item.detail}</div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-400">
            Toda la planificación detallada está disponible en la página de proyectos y en Discord.
          </p>
        </div>
      </header>

      <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Explora las nuevas páginas</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Cada sección se cargó como ruta independiente para profundizar contenidos sin perder velocidad. Están prefetch y listas para visitar al instante.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {quickSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              prefetch
              className={`group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/10`}
            >
              <div>
                <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${section.accent} px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-black shadow`}>Nuevo</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{section.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-200 transition group-hover:translate-x-1">
                Entrar
                <span aria-hidden>↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Conecta con la comunidad</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Sígueme para no perderte streams, anuncios y oportunidades de scrims o torneos.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {socialLinks.map((link) => (
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

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Únete a Discord</h2>
            <p className="text-sm text-zinc-300">
              Feedback de drafts, partidas analizadas en directo y canales privados para miembros activos.
            </p>
          </div>
          <Link
            href="https://discord.gg/codevamp"
            prefetch={false}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Entrar al servidor
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
