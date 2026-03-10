"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  initialProjects,
  mapDevProjectRow,
  type DevProject,
  type DevProjectRow,
} from "@/app/lib/dev-projects";
import { devSupabase as supabase } from "@/app/lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";

function canEmbedDemo(value: string) {
  const url = value.trim();
  if (!url) {
    return false;
  }
  return /^https?:\/\//i.test(url);
}

export default function DevProjectPage() {
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const t = {
    invalidId: isEs ? "ID de proyecto invalido." : "Invalid project id.",
    notFound: isEs ? "Proyecto no encontrado." : "Project not found.",
    projectDetail: isEs ? "Detalle de proyecto" : "Project detail",
    inDev: isEs ? "En desarrollo" : "In development",
    published: isEs ? "Publicados" : "Published",
    back: isEs ? "Volver" : "Back",
    loadingProject: isEs ? "Cargando proyecto..." : "Loading project...",
    preview: isEs ? "Vista previa" : "Preview",
    internalTool: isEs ? "Herramienta interna" : "Internal tool",
    internalRouteHint: isEs ? "Este proyecto usa una ruta interna." : "This project uses an internal route.",
    previewPending: isEs ? "Vista pendiente" : "Preview pending",
    noPublicDemo: isEs ? "Este proyecto aun no tiene URL de demo publica." : "This project has no public demo URL yet.",
    backToFeed: isEs ? "Volver al feed" : "Back to feed",
    openDemo: isEs ? "Abrir demo" : "Open demo",
    repository: isEs ? "Repositorio" : "Repository",
    devBrand: "Dev",
  };
  const params = useParams<{ id: string | string[] }>();
  const routeId = params?.id;
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;
  const fallbackCatalog = useMemo(() => initialProjects, []);
  const [project, setProject] = useState<DevProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setError(t.invalidId);
      setLoading(false);
      return;
    }

    const localMatch = fallbackCatalog.find((item) => item.id === projectId);
    if (localMatch) {
      setProject(localMatch);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      if (!supabase) {
        if (active) {
          setError(t.notFound);
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("dev_projects")
        .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
        .eq("id", projectId)
        .single();

      if (!active) {
        return;
      }

      if (fetchError || !data) {
        setError(t.notFound);
        setLoading(false);
        return;
      }

      setProject(mapDevProjectRow(data as DevProjectRow));
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [fallbackCatalog, projectId, t.invalidId, t.notFound]);

  return (
    <main className="dev-root dev-root--stable" data-brand="dev">
      <div className="dev-shell">
        <header className="dev-topbar">
          <Link href="/dev" className="dev-brand" prefetch>
            <span className="dev-brand__badge">DV</span>
            <span className="dev-brand__text">
              <strong>{t.devBrand}</strong>
              <span>{t.projectDetail}</span>
            </span>
          </Link>
          <nav className="dev-nav">
            <Link href="/dev" prefetch>
              {t.inDev}
            </Link>
            <Link href="/proyectos" prefetch>
              {t.published}
            </Link>
          </nav>
          <button type="button" className="dev-topbar__cta" onClick={() => setUiLanguage(language === "es" ? "en" : "es")}>
            {language.toUpperCase()}
          </button>
          <Link className="dev-topbar__cta" href="/dev" prefetch>
            {t.back}
          </Link>
        </header>

        {loading ? <section className="dev-card">{t.loadingProject}</section> : null}
        {!loading && error ? <section className="dev-card">{error}</section> : null}

        {!loading && project ? (
          <section className="dev-card" style={{ gap: "0.75rem", padding: "0.9rem" }}>
            <div className="dev-card__head">
              <h2>{project.title}</h2>
              <span className={`dev-status dev-status--${project.status}`}>{project.status}</span>
            </div>
            <p>{project.summary}</p>
            <div className="dev-card__meta">
              <span>{project.stack}</span>
              <span>{project.lookingFor}</span>
              <span>{project.author}</span>
              <span>{project.updated}</span>
            </div>

            {project.demoUrl ? (
              <div className="dev-card__preview" style={{ minHeight: "360px" }}>
                {canEmbedDemo(project.demoUrl) ? (
                  <iframe
                    src={project.demoUrl}
                    title={`${t.preview} ${project.title}`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="dev-card__preview-empty">
                    <span>{t.internalTool}</span>
                    <p>{t.internalRouteHint}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="dev-card__preview">
                <div className="dev-card__preview-empty">
                  <span>{t.previewPending}</span>
                  <p>{t.noPublicDemo}</p>
                </div>
              </div>
            )}

            <div className="dev-card__actions">
              <Link href="/dev" prefetch>
                {t.backToFeed}
              </Link>
              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noreferrer">
                  {t.openDemo}
                </a>
              ) : null}
              {project.repoUrl ? (
                <a href={project.repoUrl} target="_blank" rel="noreferrer">
                  {t.repository}
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
