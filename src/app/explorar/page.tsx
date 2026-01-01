import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const explorables = [
  {
    title: "Mapa de resonancias",
    type: "Interfaz experimental",
    status: "En vivo",
    detail: "Una cartografia interactiva que cambia segun tu ritmo de exploracion.",
  },
  {
    title: "Jardin modular",
    type: "Objeto digital",
    status: "Iteracion",
    detail: "Un sistema de piezas que crece con cada visita y guarda memoria visual.",
  },
  {
    title: "Loop-lab",
    type: "Experiencia sonora",
    status: "Laboratorio",
    detail: "Explora micro-bucles de sonido y visuales como si fueran materiales fisicos.",
  },
  {
    title: "Pasillo de sombras",
    type: "Prototipo jugable",
    status: "En construccion",
    detail: "Una experiencia breve para jugar con luz, direccion y presencia.",
  },
  {
    title: "Archivo vivo",
    type: "Coleccion abierta",
    status: "Curaduria",
    detail: "Trabajos de otras personas: animacion, arte interactivo y piezas hibridas.",
  },
  {
    title: "Ventanas habitables",
    type: "Herramienta creativa",
    status: "Borrador",
    detail: "Un sistema para crear interfaces que respiran y se reordenan solas.",
  },
];

const explorationRules = [
  {
    title: "Entra sin mapa fijo",
    detail: "Cada exploracion revela rutas nuevas. Deja que el sistema te guie.",
  },
  {
    title: "Interaccion > lectura",
    detail: "Toca, arrastra, escucha, cambia estados. Ahi esta la historia.",
  },
  {
    title: "Comparte lo inesperado",
    detail: "Los hallazgos de otros ayudan a desbloquear nuevas capas del laboratorio.",
  },
];

export default function ExplorarPage() {
  return (
    <SiteShell currentPath="/explorar">
      <header className="grid gap-6">
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Exploracion activa
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Bienvenido al laboratorio: aqui todo se toca
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Este no es un catalogo. Es un mapa de experiencias vivas. Las piezas cambian, se mezclan y se expanden cuando las
          exploras. Elige un portal y recorre con curiosidad.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/proyectos"
            prefetch
            className="inline-flex items-center border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          >
            Ver colecciones abiertas
          </Link>
          <a
            href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/50 hover:text-white"
          >
            Compartir proyecto
          </a>
        </div>
      </header>

      <section className="mt-12 grid gap-6" aria-labelledby="mapa">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mapa del laboratorio</p>
          <h2 id="mapa" className="text-2xl font-semibold text-white">
            Explorables en curso
          </h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Cada pieza tiene su propio ritmo. Algunas estan vivas, otras en construccion. Todas se pueden tocar.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {explorables.map((item) => (
            <article
              key={item.title}
              className="flex h-full flex-col justify-between border-t border-white/10 pt-6"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{item.type}</p>
                  </div>
                  <span className="border border-white/20 px-3 py-1 text-[11px] font-semibold text-slate-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{item.detail}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200">
                Explorar -
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6" aria-labelledby="como-explorar">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Como explorar</p>
          <h2 id="como-explorar" className="text-2xl font-semibold text-white">
            Reglas minimas, maxima curiosidad
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {explorationRules.map((rule) => (
            <div key={rule.title} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{rule.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Abre una nueva puerta</h2>
            <p className="text-sm text-slate-300">
              Si tienes un proyecto o una pieza que quieras compartir, escribenos y lo sumamos a las colecciones vivas.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@CodevaMPStudio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          >
            Ver procesos en YouTube
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
