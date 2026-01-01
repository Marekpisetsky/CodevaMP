import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const projectCollections = [
  {
    name: "Interfaces vivas",
    description: "Experimentos visuales e interactivos que responden al ritmo del usuario.",
    initiatives: [
      { title: "Topografias mutantes", detail: "Mapas sensibles al gesto y al tiempo de exploracion." },
      { title: "Ventanas respirables", detail: "Layouts modulares que se reorganizan con luz y sonido." },
      { title: "Cartografias fluidas", detail: "Rutas no lineales para descubrir historias en capas." },
    ],
  },
  {
    name: "Arte y animacion",
    description: "Piezas animadas, objetos digitales y sistemas expresivos curados por el estudio.",
    initiatives: [
      { title: "Loops organicos", detail: "Animaciones breves como artefactos sensoriales." },
      { title: "Esculturas digitales", detail: "Formas que viven entre lo fisico y lo digital." },
    ],
  },
  {
    name: "Prototipos jugables",
    description: "Microjuegos y experiencias cortas que exploran mecanicas nuevas.",
    initiatives: [
      { title: "Pasillos interactivos", detail: "Juegos breves con enfoque en presencia y ritmo." },
      { title: "Sistemas de decision", detail: "Prototipos que reaccionan a elecciones sutiles." },
    ],
  },
];

const calls = [
  {
    title: "Convocatoria permanente",
    detail: "Recibimos piezas de artistas, animadores, disenadores y personas curiosas.",
  },
  {
    title: "Residencias modulares",
    detail: "Acompanamos proyectos en proceso con feedback y exploracion conjunta.",
  },
  {
    title: "Colecciones tematicas",
    detail: "Curamos series de obras con un hilo sensorial o conceptual compartido.",
  },
];

export default function ProyectosPage() {
  return (
    <SiteShell currentPath="/proyectos">
      <header className="space-y-6">
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Proyectos y colecciones
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Colecciones explorables en expansion</h1>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          CodevaMP Studio publica proyectos propios y de otras personas. No es un portafolio, es un archivo vivo de
          exploraciones interactivas, arte y sistemas en movimiento.
        </p>
        <Link
          href="/explorar"
          prefetch
          className="inline-flex items-center gap-2 border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
        >
          Ir al laboratorio
        </Link>
      </header>

      <section className="mt-12 grid gap-6">
        <h2 className="text-2xl font-semibold text-white">Colecciones principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {projectCollections.map((category) => (
            <div key={category.name} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{category.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {category.initiatives.map((initiative) => (
                  <li key={initiative.title} className="border-l border-white/10 pl-3">
                    <span className="font-semibold text-white">{initiative.title}</span>
                    <p className="text-xs text-slate-300">{initiative.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Convocatorias abiertas</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Queremos sumar exploraciones de distintas disciplinas. Comparte tu pieza y la curamos en el archivo vivo.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {calls.map((call) => (
            <div key={call.title} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{call.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{call.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Quieres participar?</h2>
            <p className="text-sm text-slate-300">
              Envia tu propuesta y la hacemos parte del universo CodevaMP Studio.
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          >
            Compartir proyecto
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
