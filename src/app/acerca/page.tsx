import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const milestones = [
  {
    year: "2021",
    title: "Nacimiento del canal",
    description:
      "Primeros streams en Twitch experimentando con formato educativo y showcases de Mobile Legends para la comunidad latina.",
  },
  {
    year: "2022",
    title: "Consolidación comunitaria",
    description:
      "Se lanza el servidor de Discord y se establecen scrims semanales, torneos amistosos y mentorías uno a uno.",
  },
  {
    year: "2023",
    title: "Ecosistema multiplataforma",
    description:
      "Expansión a YouTube y TikTok con series de microguías, resúmenes de parches y entrevistas a jugadores destacados.",
  },
  {
    year: "2024",
    title: "Roadmap competitivo",
    description:
      "La comunidad patrocina la primera liga CodevaMP, se crean bootcamps especializados y llega la beta del laboratorio táctico.",
  },
];

const values = [
  {
    name: "Comunidad segura",
    detail:
      "Moderación activa, políticas anti-tox y herramientas de reporte directo. Queremos espacios donde todas las personas se sientan cómodas practicando.",
  },
  {
    name: "Aprendizaje colaborativo",
    detail:
      "Clases abiertas, análisis en vivo y feedback constante. El conocimiento se comparte y se construye entre todos.",
  },
  {
    name: "Transparencia",
    detail:
      "Los presupuestos de torneos, donaciones y patrocinadores se publican periódicamente para mantener la confianza de la familia CodevaMP.",
  },
  {
    name: "Diversión con propósito",
    detail:
      "Competir y crear contenido sin perder el enfoque chill. Hay espacio para tryhardear y también para relajarse después de ranked.",
  },
];

const streamingSchedule = [
  { day: "Lunes", focus: "VOD review con subs", platforms: "Twitch · Discord" },
  { day: "Miércoles", focus: "Scrims MLBB y coaching", platforms: "Twitch · YouTube" },
  { day: "Viernes", focus: "Bootcamp Road to Mythic", platforms: "YouTube · Discord" },
  { day: "Domingo", focus: "Community Chill y variety", platforms: "Twitch · Kick" },
];

export default function AcercaPage() {
  return (
    <SiteShell currentPath="/acerca" accent="indigo">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
          Sobre CodevaMP
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">La familia que impulsa tus metas gamer</h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Hola, soy CodevaMP. Empecé creando guías de Mobile Legends para ayudar a colegas de la región que no encontraban recursos en español. Hoy somos una comunidad interdisciplinaria que organiza torneos, labs tácticos y espacios seguros para que cualquier gamer latino pueda crecer a su ritmo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/proyectos"
            prefetch
            className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Ver proyectos activos
          </Link>
          <Link
            href="/donaciones"
            prefetch
            className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
          >
            Cómo apoyarnos
          </Link>
        </div>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Nuestra historia en hitos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((milestone) => (
            <div
              key={milestone.year}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <span className="text-sm font-semibold text-indigo-200">{milestone.year}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{milestone.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{milestone.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Lo que defendemos</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Nuestros valores definen cómo trabajamos, moderamos y planificamos cada iniciativa comunitaria.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {values.map((value) => (
            <div key={value.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{value.name}</h3>
              <p className="mt-2 text-sm text-zinc-300">{value.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Agenda semanal de contenido</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            El calendario se ajusta a los torneos y parches competitivos, pero mantenemos una estructura clara para coordinar la comunidad.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-zinc-300">
            <thead className="bg-white/10 text-xs uppercase tracking-wide text-zinc-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">Día</th>
                <th scope="col" className="px-4 py-3 text-left">Enfoque</th>
                <th scope="col" className="px-4 py-3 text-left">Plataformas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {streamingSchedule.map((block) => (
                <tr key={block.day} className="bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{block.day}</td>
                  <td className="px-4 py-3">{block.focus}</td>
                  <td className="px-4 py-3 text-indigo-200">{block.platforms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Súmate al viaje</h2>
            <p className="text-sm text-zinc-300">
              Tu feedback y energía son claves. Comparte ideas, propón alianzas o únete como staff voluntario para próximos eventos.
            </p>
          </div>
          <Link
            href="mailto:hola@codevamp.gg"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Escribir a CodevaMP
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
