import SiteShell from "@/app/components/site-shell";

const legalSections = [
  {
    title: "Aviso legal",
    content:
      "CodevaMP es una marca enfocada en creación de contenido, organización de torneos y mentoría comunitaria. Operamos desde Perú y cumplimos con las normativas aplicables sobre derechos de autor y comercio electrónico.",
  },
  {
    title: "Política de privacidad",
    content:
      "Los datos recopilados (emails, usuarios de Discord) se usan únicamente para enviar comunicados de la comunidad y coordinar eventos. Puedes solicitar la eliminación de tus datos escribiendo a hola@codevamp.gg.",
  },
  {
    title: "Condiciones de uso",
    content:
      "Al participar en nuestras plataformas aceptas mantener un ambiente respetuoso, evitar contenido discriminatorio y seguir las reglas publicadas en Discord y transmisiones. El incumplimiento puede derivar en expulsión de actividades.",
  },
];

const compliance = [
  {
    heading: "Propiedad intelectual",
    detail: "Todo el material gráfico, overlays y guías son propiedad de CodevaMP o cuentan con licencia del autor correspondiente. No se permite su redistribución sin autorización escrita.",
  },
  {
    heading: "Cobertura de eventos",
    detail: "Los streams o torneos que organizamos pueden ser grabados y retransmitidos. Participar implica autorizar el uso de imagen de forma no exclusiva con fines promocionales.",
  },
  {
    heading: "Reportes y soporte",
    detail: "Disponemos de formularios anónimos y contacto directo para reportar abuso o irregularidades. Todas las denuncias se investigan en un plazo máximo de 72 horas.",
  },
];

export default function LegalPage() {
  return (
    <SiteShell currentPath="/legal" accent="violet">
      <header className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-10">
        <span className="inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Reglas claras para una comunidad segura</h1>
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
          Nos comprometemos con la transparencia, la protección de datos y un ambiente libre de toxicidad. Revisa las políticas vigentes y canales de contacto para cualquier duda.
        </p>
      </header>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Documentos principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {legalSections.map((section) => (
            <div key={section.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{section.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Compromisos adicionales</h2>
          <p className="max-w-xl text-sm text-zinc-300">
            Estas pautas complementan nuestros términos y se adaptan a las necesidades de la comunidad conforme crece.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-zinc-300">
          {compliance.map((item) => (
            <li key={item.heading} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">{item.heading}</h3>
              <p className="mt-2 text-sm text-zinc-300">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">Contacto legal</h2>
        <p className="text-sm text-zinc-300">
          Para solicitudes formales, envía un correo a <a href="mailto:legal@codevamp.gg" className="text-fuchsia-200 underline">legal@codevamp.gg</a>. También puedes usar el canal #soporte-legal en Discord para dudas rápidas.
        </p>
      </section>
    </SiteShell>
  );
}
