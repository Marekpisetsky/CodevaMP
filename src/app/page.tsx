import MobileLegendsPicker from "./components/mobile-legends-picker";

export default function Page() {
  const navItems = [
    { href: "#acerca", label: "Acerca de" },
    { href: "#juegos", label: "Juegos" },
    { href: "#proyectos", label: "Proyectos" },
    { href: "#donaciones", label: "Donaciones" },
    { href: "#legal", label: "Legal" }
  ];

  const socialLinks = [
    { href: "https://youtube.com/@CodevaMPYT", label: "YouTube", sub: "Videos, retos y directos", emoji: "▶️" },
    { href: "https://twitch.tv/codevamp", label: "Twitch", sub: "Streams chill", emoji: "🎥" },
    { href: "https://kick.com/codevamp", label: "Kick", sub: "Directos alternos", emoji: "🟢" },
    { href: "https://www.tiktok.com/@codevamp_official", label: "TikTok", sub: "Clips y highlights", emoji: "🎶" },
    { href: "https://instagram.com/codevamp_official", label: "Instagram", sub: "Arte y previews", emoji: "📸" },
    { href: "https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT", label: "Comunidad WhatsApp", sub: "Únete al chat oficial", emoji: "💬" }
  ];

  const donationOptions = [
    { href: "https://paypal.me/codevamp", label: "PayPal", description: "Apoya con una donación única o recurrente de forma segura.", accent: "from-indigo-500 to-cyan-400" },
    { href: "https://ko-fi.com/codevamp", label: "Ko-fi", description: "Invítame un café digital y ayuda a producir más contenido.", accent: "from-fuchsia-500 to-amber-400" },
    { href: "https://patreon.com/codevamp", label: "Patreon", description: "Únete como mecenas para acceder a beneficios exclusivos.", accent: "from-purple-500 to-blue-400" }
  ];

  const projectCategories = [
    {
      id: "mlbb",
      title: "Mobile Legends: Bang Bang",
      description:
        "Guías, estrategias y eventos especiales centrados en MLBB para impulsar a la comunidad hispana.",
      projects: [
        { name: "Road to Mythic", detail: "Serie competitiva semanal con análisis de partidas rank." },
        { name: "Academia MLBB", detail: "Cursos rápidos para roles, composiciones y macrojuego." },
        { name: "Liga Comunidad", detail: "Torneos mensuales patrocinados por la comunidad." }
      ]
    },
    {
      id: "fps",
      title: "Shooter & FPS",
      description:
        "Cobertura de Valorant, Call of Duty y otros shooters con tácticas, configuraciones y scrims comunitarios.",
      projects: [
        { name: "Valorant Bootcamp", detail: "Entrenamientos y custom lobbies para mejorar aim y comunicación." },
        { name: "Zona COD", detail: "Retos por temporadas y breakdowns de las mejores armas." }
      ]
    },
    {
      id: "aventura",
      title: "Aventura & RPG",
      description:
        "Experiencias inmersivas, reseñas narrativas y guías de progresión para títulos de mundo abierto.",
      projects: [
        { name: "Ruta RPG", detail: "Streams guiados con decisiones de la comunidad." },
        { name: "Lore Fridays", detail: "Charlas en directo sobre historias y universos favoritos." }
      ]
    }
  ];

  const legalItems = [
    {
      title: "Aviso Legal",
      detail:
        "CodevaMP es una marca dedicada a la creación de contenido y organización de eventos gaming. Toda la información publicada se ofrece con fines divulgativos y de entretenimiento."
    },
    {
      title: "Política de Privacidad",
      detail:
        "Los datos recabados a través de formularios o newsletters se utilizan exclusivamente para comunicación comunitaria. Puedes solicitar la eliminación de tus datos en cualquier momento escribiendo a hola@codevamp.gg."
    },
    {
      title: "Términos de Uso",
      detail:
        "Al participar en nuestras comunidades aceptas mantener un ambiente respetuoso, seguir las normas publicadas y cumplir con la normativa vigente sobre propiedad intelectual y conducta online."
    }
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
          </div>
        </section>

        <section id="donaciones" className="mt-16 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Apoya el proyecto</h2>
              <p className="text-sm text-zinc-300">
                Cada aportación ayuda a producir nuevos eventos, mejorar la calidad de los directos y financiar premios
                para la comunidad.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-200">
              Transparencia total
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {donationOptions.map((option) => (
              <a
                key={option.href}
                href={option.href}
                target="_blank"
                rel="noreferrer"
                className={`flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/40 hover:bg-white/10`}
              >
                <span
                  className={`inline-flex w-fit items-center rounded-full bg-gradient-to-r ${option.accent} px-3 py-1 text-xs font-semibold text-black`}
                >
                  {option.label}
                </span>
                <p className="text-sm text-zinc-200">{option.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section id="juegos" className="mt-16 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                Juegos · Mobile Legends: Bang Bang
              </span>
              <h2 className="text-2xl font-semibold text-white">Laboratorio táctico para la Land of Dawn</h2>
              <p className="text-sm text-zinc-300">
                Desde guías rápidas hasta análisis de drafts competitivos, esta sección concentra todo lo
                relacionado con Mobile Legends: Bang Bang. Aprende a leer composiciones, optimiza tu rotación
                y encuentra picks que se adapten a cada parche.
              </p>
              <p className="text-xs text-zinc-400">
                Actualizado semanalmente con parches, torneos y sugerencias basadas en scrims de la comunidad.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200">
              <h3 className="text-lg font-semibold text-white">Eventos destacados</h3>
              <ul className="mt-3 space-y-3 text-xs">
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  📅 Clash semanal: Serie BO3 con revisión de drafts en directo.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  🧭 Ruta a Mythic: Mentorías express para roles clave cada jueves.
                </li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  🧠 Taller de macro: Cómo convertir ventaja de tortuga en presión cruzada.
                </li>
              </ul>
            </div>
          </div>

          <MobileLegendsPicker />
        </section>

        <section id="proyectos" className="mt-16 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Proyectos en curso</h2>
              <p className="text-sm text-zinc-300">
                Organización dedicada por categorías para ayudarte a encontrar el contenido que más te inspira.
              </p>
            </div>
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
