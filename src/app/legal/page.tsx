import SiteShell from "@/app/components/site-shell";

const legalSections = [
  {
    title: "Aviso legal",
    content:
      "CodevaMP Studio es un laboratorio creativo dedicado a sistemas interactivos, arte digital y experiencias explorables.",
  },
  {
    title: "Politica de privacidad",
    content:
      "Solo recopilamos datos cuando es necesario para coordinar convocatorias o colaboraciones. Puedes solicitar la eliminacion de tu informacion en cualquier momento.",
  },
  {
    title: "Condiciones de uso",
    content:
      "Al interactuar con nuestras piezas aceptas un uso respetuoso y la autoria de cada creador. La redistribucion sin permiso no esta permitida.",
  },
];

const compliance = [
  {
    heading: "Propiedad intelectual",
    detail:
      "Cada proyecto mantiene los creditos de su autor o autora. Las colecciones solo exhiben material con permiso explicito.",
  },
  {
    heading: "Uso de imagen y documentacion",
    detail:
      "Al enviar una pieza para curaduria autorizas su exhibicion en el laboratorio y en materiales promocionales del estudio.",
  },
  {
    heading: "Contacto y soporte",
    detail:
      "Si detectas un problema con una pieza o necesitas retirar material, escribe por nuestros canales oficiales.",
  },
];

export default function LegalPage() {
  return (
    <SiteShell currentPath="/legal">
      <header className="space-y-6">
        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Legal y confianza
        </span>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Reglas claras para un laboratorio abierto</h1>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          Queremos construir un espacio seguro para la exploracion creativa. Estas politicas mantienen el cuidado y la
          transparencia del estudio.
        </p>
      </header>

      <section className="mt-12 grid gap-6">
        <h2 className="text-2xl font-semibold text-white">Documentos principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {legalSections.map((section) => (
            <div key={section.title} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{section.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Compromisos adicionales</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Estas pautas complementan las condiciones de uso y se actualizan conforme el laboratorio crece.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-slate-300">
          {compliance.map((item) => (
            <li key={item.heading} className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold text-white">{item.heading}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-4">
        <h2 className="text-2xl font-semibold text-white">Canales oficiales</h2>
        <p className="text-sm text-slate-300">
          Puedes escribirnos desde el grupo de WhatsApp o comentar en YouTube para soporte y solicitudes formales.
        </p>
      </section>
    </SiteShell>
  );
}
