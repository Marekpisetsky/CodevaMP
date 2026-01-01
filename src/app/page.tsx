import Link from "next/link";
import SiteShell from "./components/site-shell";
import ForestScene from "./components/forest-scene";

const focusAreas = [
  {
    title: "Explorables",
    description:
      "Mini-apps, prototipos jugables, herramientas, juegos breves e interfaces que se descubren tocando, no leyendo.",
    points: [
      "Interacciones cortas pero memorables, pensadas como recorridos.",
      "Capas modulares para remezclar y expandir cada idea.",
      "Documentamos proceso, pruebas y descubrimientos visuales.",
    ],
    cta: { label: "Entrar al laboratorio", href: "/explorar" },
  },
  {
    title: "Colecciones abiertas",
    description:
      "Curamos trabajos propios y de otras personas: arte, animacion, objetos digitales y sistemas vivos.",
    points: [
      "Convocatorias abiertas para proyectos externos.",
      "No solo tecnologia: tambien belleza, ritmo y materialidad.",
      "Las colecciones crecen por afinidad, no por categoria fija.",
    ],
    cta: { label: "Ver colecciones", href: "/proyectos" },
  },
  {
    title: "Sistemas interactivos",
    description:
      "Construimos universos que mutan: interfaces experimentales, mapas no lineales y laboratorios de experiencia.",
    points: [
      "Exploracion antes que navegacion.",
      "Diseno sensorial con sonido, motion y capas de estado.",
      "Ritmos lentos: cada modulo tiene tiempo de madurar.",
    ],
    cta: { label: "Explorar el manifiesto", href: "/acerca" },
  },
];

const studioSignals = [
  {
    title: "Mapa vivo",
    detail: "El laboratorio se reorganiza cada ciclo. Los proyectos migran y se recombinan.",
  },
  {
    title: "Colecciones hibridas",
    detail: "Animaciones, objetos fisicos digitalizados y piezas interactivas conviven en un mismo recorrido.",
  },
  {
    title: "Apertura creativa",
    detail: "Publicamos prototipos en proceso para invitar a nuevas lecturas y remezclas.",
  },
];

const communityChannels = [
  {
    href: "https://www.youtube.com/@CodevaMPStudio",
    label: "YouTube",
    sub: "Procesos, visuales y exploraciones en video",
    emoji: "YT",
  },
  {
    href: "https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT",
    label: "WhatsApp",
    sub: "Convocatorias rapidas y novedades del laboratorio",
    emoji: "WA",
  },
];

export default function Page() {
  return (
    <SiteShell currentPath="/" disableEffects>
      <section id="hero-section" className="scene-panel scene-panel--visual" aria-label="Escena interactiva">
        <ForestScene />
      </section>

      <section id="intro-section" className="scene-panel scene-panel--intro" aria-labelledby="studio-hero">
        <div className="scene-panel__content grid gap-14 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
          <div className="space-y-6">
            <span className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-slate-300">
              CodevaMP Studio - universo en construccion
            </span>
            <h1 id="studio-hero" className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Proyectos que no se navegan: se exploran, se sienten, se descubren.
            </h1>
            <p className="text-base text-slate-300 sm:text-lg">
              CodevaMP Studio es un laboratorio de sistemas interactivos. Construimos y publicamos piezas explorables:
              mini-apps, prototipos jugables, herramientas, animaciones y experiencias modulares que evolucionan con el tiempo.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/explorar"
                prefetch
                className="inline-flex items-center border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
              >
                Explorar el laboratorio
              </Link>
              <Link
                href="/proyectos"
                prefetch
                className="inline-flex items-center border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/50 hover:text-white"
              >
                Ver colecciones abiertas
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 text-sm text-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-white">Manifiesto</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Exploracion en curso</p>
            </div>
            <div className="space-y-4">
              {studioSignals.map((signal) => (
                <div key={signal.title} className="border-l border-white/20 pl-4">
                  <h3 className="text-sm font-semibold text-white">{signal.title}</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    {signal.detail}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/acerca"
              prefetch
              className="inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-2 text-xs font-semibold transition hover:border-white/60 hover:text-white"
            >
              Conoce el manifiesto -
            </Link>
          </div>
        </div>
      </section>

      <section className="scene-panel" aria-labelledby="areas-clave">
        <div className="scene-panel__content grid gap-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ejes creativos</p>
            <h2 id="areas-clave" className="text-2xl font-semibold text-white">
              Lo que se construye ahora mismo
            </h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Disenamos sistemas que invitan a explorar. Cada bloque es una puerta a nuevas pruebas y colaboraciones.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {focusAreas.map((area) => (
              <div key={area.title} className="flex flex-col gap-4 border-t border-white/10 pt-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{area.title}</h3>
                  <p className="text-sm text-slate-300">{area.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-slate-200">
                  {area.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden className="mt-1 text-emerald-200">-</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <Link
                    href={area.cta.href}
                    prefetch
                    className="inline-flex items-center gap-2 border-b border-white/40 pb-1 text-xs font-semibold text-white"
                  >
                    {area.cta.label} -
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scene-panel" aria-labelledby="modo-exploracion">
        <div className="scene-panel__content grid gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Modo exploracion</p>
            <h2 id="modo-exploracion" className="text-2xl font-semibold text-white">
              No es un catalogo, es un recorrido
            </h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Cada proyecto vive como un fragmento de un universo mas amplio. Entrar implica tocar, mover, escuchar y descubrir.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">Explora con tiempo</h3>
              <p className="mt-2 text-sm text-slate-300">
                Las piezas reaccionan a la curiosidad. No hay prisa, hay capas.
              </p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">Interaccion primero</h3>
              <p className="mt-2 text-sm text-slate-300">
                Las instrucciones son minimas. La experiencia se aprende tocandola.
              </p>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">Comparte hallazgos</h3>
              <p className="mt-2 text-sm text-slate-300">
                Documentar lo inesperado es parte del laboratorio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="scene-panel" aria-labelledby="comunidad">
        <div className="scene-panel__content grid gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Puertas abiertas</p>
            <h2 id="comunidad" className="text-2xl font-semibold text-white">
              Conecta con el laboratorio
            </h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Compartimos procesos y abrimos convocatorias en estos canales. El estudio crece con nuevas miradas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {communityChannels.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 border-b border-white/10 px-2 py-4 transition hover:border-white/50"
              >
                <span className="text-sm font-semibold text-emerald-200">{link.emoji}</span>
                <div className="flex-1">
                  <div className="font-medium text-white">{link.label}</div>
                  <div className="text-xs text-slate-300">{link.sub}</div>
                </div>
                <span className="opacity-60 transition group-hover:opacity-100">-</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
