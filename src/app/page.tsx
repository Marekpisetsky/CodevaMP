export default function Page() {
  const navItems = [
    { href: "#acerca", label: "Acerca de" },
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050513] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-1/3 top-1/4 h-80 w-80 rounded-full bg-purple-500 blur-[120px]" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-500 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <nav className="flex flex-wrap items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
              CV
            </span>
            <div>
              <span className="block text-sm uppercase tracking-wide text-indigo-200">CodevaMP</span>
              <span className="text-xs text-zinc-300">Gaming Studio & Comunidad</span>
            </div>
          </div>

          <div className="hidden gap-6 text-sm font-medium text-zinc-300 md:flex">
            {navItems.map((item) => (
              <a key={item.href} className="transition hover:text-white" href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <a
            href="#donaciones"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02] md:mt-0"
          >
            💖 Apoya el proyecto
          </a>
        </nav>

        <header className="grid gap-6 py-16 sm:grid-cols-[1.3fr,1fr] sm:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-zinc-200">
              Comunidad gamer latina
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Contenido, torneos y espacios seguros para gamers que buscan crecer juntos.
            </h1>
            <p className="text-base text-zinc-300 sm:text-lg">
              En CodevaMP creemos en el poder de la comunidad. Desde streams chill hasta proyectos competitivos,
              construimos experiencias colaborativas centradas en Mobile Legends: Bang Bang y otros títulos que nos
              apasionan.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#proyectos"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
              >
                Explorar proyectos
              </a>
              <a
                href="https://discord.gg/codevamp"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
              >
                Únete al Discord
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Highlights de la semana</h2>
            <ul className="mt-4 space-y-3">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                🎮 Torneo comunitario MLBB el sábado · Inscripciones abiertas
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                🛠️ Producción del nuevo layout para directos multijuego
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-3">
                🎧 Podcast “Meta Update” disponible en Spotify y YouTube
              </li>
            </ul>
          </div>
        </header>

        <section id="enlaces" className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Conecta con la comunidad</h2>
            <p className="max-w-xl text-sm text-zinc-300">
              Sígueme en todas las plataformas para no perderte streams, anuncios importantes y contenido exclusivo.
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

        <section id="proyectos" className="mt-16 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Proyectos en curso</h2>
              <p className="text-sm text-zinc-300">
                Organización dedicada por categorías para ayudarte a encontrar el contenido que más te inspira.
              </p>
            </div>
            <a
              href="https://notion.so/codevamp"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
            >
              Ver roadmap completo
            </a>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {projectCategories.map((category) => (
              <article key={category.id} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                  <p className="text-sm text-zinc-300">{category.description}</p>
                </div>
                <ul className="space-y-3 text-sm text-zinc-200">
                  {category.projects.map((project) => (
                    <li key={project.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="block font-medium text-white">{project.name}</span>
                      <span className="text-xs text-zinc-300">{project.detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="acerca" className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Acerca de CodevaMP</h2>
              <p className="text-sm text-zinc-300">
                Soy CodevaMP, creador de contenido y organizador de eventos con foco en la escena mobile y multijuego. El
                objetivo es crear un ecosistema donde jugadores casuales y competitivos encuentren herramientas para
                mejorar, conectar y divertirse.
              </p>
              <p className="text-sm text-zinc-300">
                Creamos recursos educativos, asesorías personalizadas y espacios seguros para la diversidad dentro del
                gaming. Si quieres colaborar, proponer ideas o sumar tu talento al equipo, ¡escríbeme!
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Servicios & valores</h3>
              <ul className="space-y-3 text-sm text-zinc-200">
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Producción de eventos y ligas personalizadas.</li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Consultorías estratégicas para equipos y creadores.</li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Enfoque en bienestar, inclusión y crecimiento sostenible.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="legal" className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Información legal</h2>
            <span className="text-xs text-zinc-400">Última actualización {new Date().toLocaleDateString()}</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {legalItems.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contacto" className="mt-16 mb-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="grid gap-4 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">¿Quieres colaborar?</h2>
              <p className="text-sm text-zinc-300">
                Escríbenos para alianzas, patrocinios, consultorías o propuestas de eventos especiales. Estamos abiertos a
                marcas, organizaciones estudiantiles y comunidades emergentes.
              </p>
              <a
                href="mailto:hola@codevamp.gg"
                className="inline-flex w-fit items-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
              >
                hola@codevamp.gg
              </a>
            </div>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="block text-xs uppercase tracking-wide text-zinc-400">Ubicación</span>
                <span>Comunidad global · Horarios CET / CDT</span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="block text-xs uppercase tracking-wide text-zinc-400">Newsletter</span>
                <span>Suscríbete para recibir recursos exclusivos y convocatorias.</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="mb-4 mt-auto flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-xs text-zinc-400 sm:flex-row">
          <span>© {new Date().getFullYear()} CodevaMP · Todos los derechos reservados</span>
          <div className="flex gap-3">
            <a href="#legal" className="hover:text-zinc-200">
              Aviso legal
            </a>
            <a href="https://github.com/CodevaMP-Official" target="_blank" rel="noreferrer" className="hover:text-zinc-200">
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
