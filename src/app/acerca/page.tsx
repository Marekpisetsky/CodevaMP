import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const milestones = [
  {
    year: "2021",
    title: "Primeros prototipos",
    description:
      "Exploraciones tempranas entre diseno, juego y animacion para entender como se sienten los sistemas interactivos.",
  },
  {
    year: "2023",
    title: "Laboratorio modular",
    description:
      "Se estructuran piezas en modulos reutilizables y se define el enfoque: interaccion antes que narrativa lineal.",
  },
  {
    year: "2024",
    title: "Colecciones abiertas",
    description:
      "Se abre la puerta a proyectos externos: arte, objetos digitales, animaciones y prototipos de distintas disciplinas.",
  },
  {
    year: "2025",
    title: "CodevaMP Studio",
    description:
      "El universo se formaliza como laboratorio creativo de sistemas interactivos y experiencias explorables.",
  },
];

const values = [
  {
    name: "Exploracion radical",
    detail:
      "Preferimos caminos no lineales. Cada pieza invita a tocar, mover y descubrir sin tutoriales largos.",
  },
  {
    name: "Belleza hibrida",
    detail:
      "Mezclamos tecnologia, arte, animacion y juego para construir experiencias sensibles y sorprendentes.",
  },
  {
    name: "Ritmo humano",
    detail:
      "Trabajamos por ciclos, no por urgencia. Las ideas necesitan tiempo para volverse explorables.",
  },
  {
    name: "Apertura creativa",
    detail:
      "Curamos trabajos de otras personas y compartimos procesos para expandir el laboratorio.",
  },
];

const studioRhythm = [
  { phase: "Semillas", focus: "Explorar conceptos y referencias", output: "Bocetos, moodboards, pruebas visuales" },
  { phase: "Prototipos", focus: "Construir interacciones minimas", output: "Piezas explorables de 1-3 minutos" },
  { phase: "Expansiones", focus: "Agregar capas sensoriales", output: "Sonido, motion, rutas alternativas" },
  { phase: "Colecciones", focus: "Publicar y curar", output: "Mapas, relatos y archivos vivos" },
];

export default function AcercaPage() {
  return (
    <SiteShell currentPath="/acerca">
      <header className="space-y-6">
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Acerca del estudio
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Un laboratorio donde la interaccion es el lenguaje principal
        </h1>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          CodevaMP Studio existe para construir universos explorables. Disenamos sistemas interactivos que mezclan juego,
          arte y tecnologia con una sola regla: la experiencia se descubre tocandola.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/explorar"
            prefetch
            className="inline-flex items-center border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          >
            Entrar al laboratorio
          </Link>
          <a
            href="https://www.youtube.com/@CodevaMPStudio"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/50 hover:text-white"
          >
            Ver procesos en video
          </a>
        </div>
      </header>

      <section className="mt-12 grid gap-6">
        <h2 className="text-2xl font-semibold text-white">Hitos del estudio</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.year}
              className="border-t border-white/10 pt-6"
            >
              <span className="text-sm font-semibold text-amber-200">{milestone.year}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{milestone.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{milestone.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Principios creativos</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Estas ideas guian cada proyecto, sin importar su formato o escala.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {values.map((value) => (
            <div key={value.name} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{value.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{value.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Ritmo del laboratorio</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Trabajamos por ciclos. Cada fase aporta un tipo de exploracion distinta.
          </p>
        </div>
        <div className="overflow-hidden border-t border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-slate-300">
            <thead className="text-xs uppercase tracking-wide text-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Fase</th>
                <th scope="col" className="px-4 py-3 text-left">Enfoque</th>
                <th scope="col" className="px-4 py-3 text-left">Salida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {studioRhythm.map((block) => (
                <tr key={block.phase}>
                  <td className="px-4 py-3 font-medium text-white">{block.phase}</td>
                  <td className="px-4 py-3">{block.focus}</td>
                  <td className="px-4 py-3 text-amber-200">{block.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Sumate al universo</h2>
            <p className="text-sm text-slate-300">
              Propuestas externas, colaboraciones y piezas experimentales son bienvenidas.
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/L8MGmH5dIzYLGpVOTxnHNT"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60"
          >
            Compartir un proyecto
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
