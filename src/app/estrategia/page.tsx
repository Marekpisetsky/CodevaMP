import Link from "next/link";
import SiteShell from "@/app/components/site-shell";

const valuePillars = [
  {
    title: "Producto que se prueba en minutos",
    detail:
      "Cada subempresa de CodevaMP debe convertir una idea en una experiencia usable en menos de un sprint.",
  },
  {
    title: "Sistema visual coherente",
    detail:
      "Una base de identidad compartida + variaciones por unidad para evitar interfaces rotas o contradictorias.",
  },
  {
    title: "Publicacion con aprendizaje",
    detail:
      "Toda entrega pasa por medicion: activacion, colaboracion, retencion y deuda tecnica registrada.",
  },
];

const ninetyDayPlan = [
  {
    window: "0-30 dias",
    focus: "Estabilizacion",
    actions: [
      "Consolidar una sola arquitectura visual y eliminar rutas experimentales fuera de producto.",
      "Reducir deuda de /dev: feed claro, CRUD estable y studio como canal de ejecucion.",
      "Bajar errores de consola de sesiones clave a cero criticos.",
    ],
  },
  {
    window: "31-90 dias",
    focus: "Escala comercial",
    actions: [
      "Implementar embudo comun por subempresa: Descubrir -> Publicar -> Colaborar -> Retener.",
      "Activar narrativa comercial por segmento: creators, builders y equipos mixtos.",
      "Definir pricing de productos premium y paquete de colaboracion empresarial.",
    ],
  },
  {
    window: "90-180 dias",
    focus: "Ventaja sostenible",
    actions: [
      "Formalizar gobierno de producto y calidad para ciclos de release predecibles.",
      "Abrir programa de alianzas con escuelas, estudios y colectivos creativos.",
      "Publicar primer reporte anual de impacto tecnico, social y economico.",
    ],
  },
];

const bcorpRoadmap = [
  {
    phase: "Fase 1 - Diagnostico",
    detail:
      "Completar linea base de impacto (gobernanza, equipo, comunidad, ambiente, clientes) y capturar brechas de politica.",
  },
  {
    phase: "Fase 2 - Evidencia",
    detail:
      "Crear carpeta viva de evidencias: contratos, politicas, metricas de cadena de valor, practicas de privacidad y seguridad.",
  },
  {
    phase: "Fase 3 - Integracion legal",
    detail:
      "Preparar ajustes legales de deber fiduciario ampliado y gobernanza de stakeholders segun jurisdiccion.",
  },
  {
    phase: "Fase 4 - Certificacion",
    detail:
      "Presentar evaluacion, resolver verificaciones, y ejecutar plan de mejora continuo post-certificacion.",
  },
];

const kpis = [
  "Activacion D7 de creadores (primer proyecto publicado)",
  "Tiempo medio de publicacion en /dev",
  "Ratio de colaboracion real por proyecto",
  "Errores de consola por sesion",
  "Score de consistencia visual por release",
  "Cumplimiento trimestral de objetivos de impacto",
];

export default function EstrategiaPage() {
  return (
    <SiteShell currentPath="/estrategia" disableEffects>
      <div className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Estrategia de negocio</span>
          <h1 className="root-title">Plan 2026 para CodevaMP: producto, crecimiento e impacto</h1>
          <p className="root-subtitle">
            Este plan convierte la vision en ejecucion medible: propuesta de valor, roadmap 90-180 dias y ruta B Corp.
          </p>
          <div className="root-actions">
            <Link href="/dev" className="root-action-button" prefetch>
              Ejecutar en /dev
            </Link>
            <a href="#bcorp-route" className="root-action-button root-action-button--ghost">
              Ver ruta de impacto
            </a>
          </div>
        </header>

        <section className="root-section story-section" aria-labelledby="value-pillars">
          <div className="root-section-header">
            <p className="root-kicker">1. Propuesta de valor</p>
            <h2 id="value-pillars">Lo que hace diferente a CodevaMP</h2>
            <p>Posicionamiento: estudio-producto que une creatividad aplicada con ejecucion tecnica.</p>
          </div>
          <div className="root-grid root-grid--three">
            {valuePillars.map((pillar) => (
              <article key={pillar.title} className="root-card root-card--compact">
                <h3>{pillar.title}</h3>
                <p>{pillar.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section story-section" aria-labelledby="plan-90">
          <div className="root-section-header">
            <p className="root-kicker">2. Ejecucion</p>
            <h2 id="plan-90">Roadmap 90-180 dias</h2>
            <p>Secuencia orientada a limpiar deuda, crecer y consolidar ventaja competitiva.</p>
          </div>
          <div className="root-grid root-grid--three">
            {ninetyDayPlan.map((block) => (
              <article key={block.window} className="root-card root-card--compact">
                <span className="root-kicker">{block.window}</span>
                <h3>{block.focus}</h3>
                <ul className="root-list-block">
                  {block.actions.map((action) => (
                    <li key={action}>
                      <p>{action}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="root-section story-section" aria-labelledby="bcorp-route">
          <div className="root-section-header">
            <p className="root-kicker">3. Sostenibilidad</p>
            <h2 id="bcorp-route">Ruta B Corp para CodevaMP</h2>
            <p>
              Camino operativo para integrar impacto social/ambiental sin frenar velocidad de producto.
            </p>
          </div>
          <div className="root-grid root-grid--two">
            {bcorpRoadmap.map((phase) => (
              <article key={phase.phase} className="root-card root-card--compact">
                <h3>{phase.phase}</h3>
                <p>{phase.detail}</p>
              </article>
            ))}
          </div>
          <p className="root-inline-accent">
            Nota: la validacion final depende de evaluacion y verificacion con B Lab segun jurisdiccion activa.
          </p>
        </section>

        <section className="root-section story-section" aria-labelledby="kpi-2026">
          <div className="root-section-header">
            <p className="root-kicker">4. Medicion</p>
            <h2 id="kpi-2026">KPIs de gobierno operativo</h2>
            <p>Sin esta capa de medicion no hay aprendizaje real ni mejora acumulativa.</p>
          </div>
          <ul className="root-list-block">
            {kpis.map((kpi) => (
              <li key={kpi}>
                <p>{kpi}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
