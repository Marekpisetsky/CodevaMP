import Link from "next/link";
import MobileLegendsPicker from "@/app/components/mobile-legends-picker";
import SiteShell from "@/app/components/site-shell";

const patchHighlights = [
  {
    title: "Parche 1.8.92",
    detail: "Ajustes a roamers de control (Khufra, Atlas) y buff para tiradores de mid game como Brody y Beatrix.",
  },
  {
    title: "Objetivos del meta",
    detail: "Juego temprano agresivo con prioridad en tortuga y visión constante del jungla enemigo.",
  },
  {
    title: "Tendencias",
    detail: "Dúos roam + jungla que puedan forzar peleas tempranas y rotaciones rápidas hacia Gold Lane.",
  },
];

const roleTips = [
  {
    role: "Jungla",
    notes: [
      "Favorece asesinos móviles con reset (Lancelot, Ling) siempre que tu equipo asegure control y visión.",
      "Si el rival tiene mucha movilidad, considera junglas utilitarios como Fredrinn para contrarrestar engages.",
    ],
  },
  {
    role: "Roam",
    notes: [
      "Khufra y Atlas siguen dominando gracias a su capacidad de cerrar espacios y controlar asesinos hyper.",
      "Supports como Diggie y Angela son clave contra composiciones con mucho CC o burst explosivo.",
    ],
  },
  {
    role: "Gold Lane",
    notes: [
      "Brody y Beatrix brillan con composiciones que habilitan peleas en mid game.",
      "Wanwan es pick situacional pero letal si tu equipo puede activar sus marcas rápidamente.",
    ],
  },
];

const resourceLinks = [
  { label: "Calendario de scrims MLBB", href: "https://discord.gg/codevamp", description: "Asegura cupos para tu escuadra y participa en análisis en vivo." },
  { label: "Notas de parche traducidas", href: "https://docs.codevamp.gg/mlbb-patch", description: "Resumen en español con ejemplos de builds y rotaciones recomendadas." },
  { label: "Checklist de draft", href: "https://docs.codevamp.gg/mlbb-draft-checklist", description: "Pasos para validar composición, objetivos y win conditions antes del lock-in." },
];

const timeline = [
  {
    label: "Lunes · Review",
    description: "VOD review grupal con foco en fase de líneas y macro decisiones.",
  },
  {
    label: "Miércoles · Scrims",
    description: "Prácticas contra equipos de nivel similar. Rotaciones y setups de objetivos en vivo.",
  },
  {
    label: "Viernes · Road to Mythic",
    description: "Coaching express por rol, ejercicios mecánicos y medición de progreso semanal.",
  },
  {
    label: "Domingo · Laboratorio abierto",
    description: "Sesión chill para responder preguntas, testear picks off-meta y compartir recursos.",
  },
];

export default function MobileLegendsPage() {
  return (
    <SiteShell currentPath="/juegos/mobile-legends" accent="violet">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
          Mobile Legends: Bang Bang
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Laboratorio MLBB · Drafts inteligentes y ejecución ordenada
        </h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Aquí centralizamos todo lo necesario para dominar el meta actual: análisis de parches, cronograma de scrims, guías por rol y el Mobile Legends Picker actualizado para planear drafts con tu equipo o en solo queue.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="https://discord.gg/codevamp"
            prefetch={false}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2 text-sm font-semibold text-black shadow-md transition hover:scale-[1.02]"
          >
            Unirse a scrims MLBB
          </Link>
          <Link
            href="/juegos"
            prefetch
            className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold transition hover:border-fuchsia-400/70 hover:text-white"
          >
            Ver todos los labs
          </Link>
        </div>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Puntos claves del meta</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {patchHighlights.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Tips por rol</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Ajusta tu plan según el draft enemigo y la sinergia con tus aliados. Recuerda que el early game define el tempo del resto de la partida.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roleTips.map((tip) => (
            <div key={tip.role} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{tip.role}</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {tip.notes.map((note) => (
                  <li key={note} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <MobileLegendsPicker />
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Cronograma semanal del laboratorio</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {timeline.map((event) => (
            <div key={event.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <span className="text-sm font-semibold text-fuchsia-200">{event.label}</span>
              <p className="mt-2 text-sm text-zinc-300">{event.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Recursos complementarios</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Mantente actualizado con plantillas y guías descargables creadas junto a la comunidad.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {resourceLinks.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-fuchsia-400/40 hover:bg-white/10"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{resource.label}</h3>
                <p className="mt-2 text-sm text-zinc-300">{resource.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-200 transition group-hover:translate-x-1">
                Abrir
                <span aria-hidden>↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
