"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteShell from "../components/site-shell";
import { fetchExecutiveDashboardData, type ExecutiveDashboardData } from "../lib/executive-dashboard";

const numberFormat = new Intl.NumberFormat("es-ES");
const dateTimeFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DashboardPage() {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await fetchExecutiveDashboardData();
        if (!active) return;
        setData(next);
      } catch (loadError) {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : "No se pudo cargar el dashboard ejecutivo.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const leaderboard = useMemo(() => {
    if (!data) return [];
    return [...data.snapshots].sort((a, b) => b.comparables.publishedAssets - a.comparables.publishedAssets);
  }, [data]);

  return (
    <SiteShell currentPath="/dashboard" disableEffects className="home-premium-shell">
      <main className="root-page">
        <header className="root-hero">
          <span className="root-eyebrow">Dashboard ejecutivo</span>
          <h1 className="root-title">Escala 90-180 dias</h1>
          <p className="root-subtitle">
            Embudo comun para subempresas: <strong>Descubrir</strong> - <strong>Publicar</strong> - <strong>Colaborar</strong> - <strong>Retener</strong>.
          </p>
          <div className="root-split">
            <span className="root-inline-accent">
              {data ? `Actualizado: ${dateTimeFormat.format(new Date(data.generatedAt))}` : "Cargando metricas..."}
            </span>
            <Link href="/dev" className="root-action-button root-action-button--ghost">
              Ir a Dev
            </Link>
            <Link href="/estrategia" className="root-action-button">
              Estrategia 2026
            </Link>
          </div>
        </header>

        {loading ? <section className="root-section"><p>Cargando dashboard...</p></section> : null}
        {error ? <section className="root-section"><p>{error}</p></section> : null}

        {data ? (
          <>
            <section className="root-section">
              <div className="root-section-header">
                <h2>Embudo Comun</h2>
                <p>
                  Definicion unificada para comparar desempeno entre unidades.
                </p>
              </div>
              <div className="root-grid root-grid--three">
                {data.funnel.map((step) => (
                  <article key={step.id} className="root-card">
                    <span className="root-kicker">{step.labelEs}</span>
                    <p>{step.descriptionEs}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="root-section">
              <div className="root-section-header">
                <h2>Comparativo Por Subempresa</h2>
                <p>Valores en la misma secuencia de embudo para evaluar avance relativo.</p>
              </div>
              <div className="root-table-wrap">
                <table className="root-table">
                  <thead>
                    <tr>
                      <th>Subempresa</th>
                      <th>Descubrir</th>
                      <th>Publicar</th>
                      <th>Colaborar</th>
                      <th>Retener (30d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.snapshots.map((snapshot) => (
                      <tr key={snapshot.brandId}>
                        <td>{snapshot.brandName}</td>
                        <td>{numberFormat.format(snapshot.funnel.discover)}</td>
                        <td>{numberFormat.format(snapshot.funnel.publish)}</td>
                        <td>{numberFormat.format(snapshot.funnel.collaborate)}</td>
                        <td>{numberFormat.format(snapshot.funnel.retain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="root-inline-accent">
                Cobertura memberships: {data.coverage.membershipsAvailable ? "activa" : "fallback por actividad publica"}
              </p>
            </section>

            <section className="root-section">
              <div className="root-section-header">
                <h2>Identidad de Marca Formalizada</h2>
                <p>Dev queda registrado como subempresa con identidad propia alineada a CodevaMP.</p>
              </div>
              <div className="root-grid root-grid--three">
                {data.snapshots.map((snapshot) => (
                  <article key={`${snapshot.brandId}-identity`} className="root-card">
                    <span className="root-kicker">{snapshot.brandName}</span>
                    <h3>{snapshot.tagline}</h3>
                    <p>{snapshot.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="root-section">
              <div className="root-section-header">
                <h2>Ranking de Publicacion</h2>
                <p>Ordenado por activos publicados para priorizar foco de crecimiento.</p>
              </div>
              <ul className="root-list-block">
                {leaderboard.map((snapshot, index) => (
                  <li key={`${snapshot.brandId}-rank`}>
                    <h3>
                      {index + 1}. {snapshot.brandName}
                    </h3>
                    <p>
                      Publicados: <strong>{numberFormat.format(snapshot.comparables.publishedAssets)}</strong> | Colaboradores activos:{" "}
                      <strong>{numberFormat.format(snapshot.comparables.activeContributors)}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </main>
    </SiteShell>
  );
}
