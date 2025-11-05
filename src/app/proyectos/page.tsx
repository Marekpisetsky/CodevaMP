import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const projectCategories = [
  {
    name: "Mobile Legends",
    description: "Serie Road to Mythic, ligas comunitarias y cursos intensivos por rol.",
    initiatives: [
      { title: "Road to Mythic", detail: "Temporadas mensuales con ladder interno, coaching y premios." },
      { title: "Academia MLBB", detail: "Clases cortas grabadas + hojas de práctica descargables." },
      { title: "Liga Comunidad", detail: "Torneo patrocinado con transmisión oficial y analistas invitados." },
    ],
  },
  {
    name: "FPS & Shooters",
    description: "Bootcamps de aim, stratbooks y scrims regulares para Valorant y COD.",
    initiatives: [
      { title: "Valorant Bootcamp", detail: "Rutinas de aim y teoría del juego divididas por roles." },
      { title: "Zona COD", detail: "Eventos temáticos según temporada con loadouts optimizados." },
    ],
  },
  {
    name: "Proyectos narrativos",
    description: "Experiencias colaborativas centradas en storytelling y decisiones de la audiencia.",
    initiatives: [
      { title: "Lore Fridays", detail: "Directos semanales explorando universos y teorías de la comunidad." },
      { title: "Ruta RPG", detail: "Campañas en vivo donde el chat decide el camino y recursos del equipo." },
    ],
  },
];

const roadmap = [
  {
    quarter: "Q1",
    focus: "Lanzar versión beta del hub de miembros y completar 3 bootcamps express.",
  },
  {
    quarter: "Q2",
    focus: "Expandir las ligas comunitarias a formato híbrido online/presencial con aliados regionales.",
  },
  {
    quarter: "Q3",
    focus: "Publicar biblioteca de recursos descargables (layouts, overlays, plantillas de torneo).",
  },
  {
    quarter: "Q4",
    focus: "Retrospectiva anual + lanzamiento de incubadora de creadores y staff voluntario.",
  },
];

export default function ProyectosPage() {
  return (
    <SiteShell currentPath="/proyectos" accent="amber">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
          Proyectos
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Roadmap creativo & competitivo 2024</h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Cada iniciativa nace de feedback directo de la comunidad. Trabajamos con objetivos trimestrales, métricas públicas y reuniones abiertas en Discord para ajustar prioridades.
        </p>
        <Link
          href="https://notion.so/codevamp-roadmap"
          prefetch={false}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
        >
          Ver tablero vivo
        </Link>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Iniciativas principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {projectCategories.map((category) => (
            <div key={category.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              <p className="mt-2 text-sm text-zinc-300">{category.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {category.initiatives.map((initiative) => (
                  <li key={initiative.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className="font-semibold text-white">{initiative.title}</span>
                    <p className="text-xs text-zinc-300">{initiative.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Roadmap trimestral</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Las metas se revisan en asambleas abiertas. Publicamos resultados y siguientes pasos en Notion.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-zinc-300">
            <thead className="bg-white/10 text-xs uppercase tracking-wide text-zinc-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Trimestre</th>
                <th scope="col" className="px-4 py-3 text-left">Objetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roadmap.map((item) => (
                <tr key={item.quarter} className="bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{item.quarter}</td>
                  <td className="px-4 py-3">{item.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Participa como staff o patrocinador</h2>
            <p className="text-sm text-zinc-300">
              Buscamos casters, diseñadores, analistas y marcas que quieran construir junto a CodevaMP. Ofrecemos reportes mensuales y espacios de visibilidad dedicados.
            </p>
          </div>
          <Link
            href="mailto:alianzas@codevamp.gg"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Escribir a alianzas
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
