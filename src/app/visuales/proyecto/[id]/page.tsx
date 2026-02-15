/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteShell from "../../../components/site-shell";
import { fetchProjectStatsMap, formatCompactMetric, getProjectStats, recordProjectView, type ProjectStats } from "../../../lib/project-stats";
import { supabase } from "../../../lib/supabase";
import { useVisualesIdentity } from "../../use-visuales-identity";

type ProjectRecord = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  media_url: string | null;
  created_at: string | null;
  user_id: string | null;
};

type RelatedProject = {
  id: string;
  title: string | null;
  type: string | null;
  media_url: string | null;
  created_at?: string | null;
  user_id?: string | null;
};

export default function VisualesProyectoPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const { sessionUser, username, displayName, displayAvatarLetter } = useVisualesIdentity();
  const routeId = params?.id;
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorProjects, setCreatorProjects] = useState<RelatedProject[]>([]);
  const [discoverProjects, setDiscoverProjects] = useState<RelatedProject[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setError("Proyecto invalido.");
      setLoading(false);
      return;
    }
    if (!supabase) {
      setError("Supabase no esta configurado.");
      setLoading(false);
      return;
    }
    supabase
      .from("projects")
      .select("id, title, description, type, media_url, created_at, user_id")
      .eq("id", projectId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }
        setProject(data as ProjectRecord);
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current || !event.target) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!supabase || !project?.user_id) {
      setCreatorProjects([]);
      setDiscoverProjects([]);
      return;
    }
    let active = true;
    setRelatedLoading(true);
    Promise.all([
      supabase
        .from("projects")
        .select("id, title, type, media_url, created_at")
        .eq("user_id", project.user_id)
        .neq("id", project.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("projects")
        .select("id, title, type, media_url, created_at, user_id")
        .neq("id", project.id)
        .neq("user_id", project.user_id)
        .order("created_at", { ascending: false })
        .limit(6),
    ])
      .then(([creatorResult, discoverResult]) => {
        if (!active) return;
        setCreatorProjects((creatorResult.data as RelatedProject[] | null) ?? []);
        setDiscoverProjects((discoverResult.data as RelatedProject[] | null) ?? []);
        setRelatedLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setCreatorProjects([]);
        setDiscoverProjects([]);
        setRelatedLoading(false);
      });
    return () => {
      active = false;
    };
  }, [project?.id, project?.user_id]);

  useEffect(() => {
    if (!project?.id) {
      setProjectStats(null);
      return;
    }
    let active = true;
    const loadStats = async () => {
      await recordProjectView(project.id);
      const map = await fetchProjectStatsMap([project.id]);
      if (!active) {
        return;
      }
      setProjectStats(getProjectStats(map, project.id));
    };
    loadStats();
    return () => {
      active = false;
    };
  }, [project?.id]);

  useEffect(() => {
    setMediaLoaded(false);
  }, [project?.id]);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    router.push("/visuales");
  };

  const handleSwitchAccount = async () => {
    await handleSignOut();
  };

  const handleMyCabina = () => {
    if (sessionUser === undefined) {
      return;
    }
    if (!sessionUser) {
      const target = username ? `/visuales/estudio/@${username}` : "/visuales/app";
      router.push(`/visuales/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}`);
      return;
    }
    router.push("/visuales/auth");
  };

  const handleSettings = () => {
    if (sessionUser === undefined) {
      return;
    }
    if (!sessionUser) {
      const target = username ? `/visuales/estudio/@${username}#ajustes` : "/visuales/app";
      router.push(`/visuales/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}#ajustes`);
      return;
    }
    router.push("/visuales/auth");
  };

  const createdLabel = project?.created_at
    ? new Date(project.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-hub visuales-hub--single" brandHref="/visuales">
      <div className="hub-topbar">
        <div className="hub-brand">
          <Link href="/visuales">
            <span className="hub-brand__badge">VS</span>
            <span className="hub-brand__text">
              <span className="hub-brand__title">Visuales</span>
              <span className="hub-brand__subtitle">Estudio creativo</span>
            </span>
          </Link>
        </div>
        <div className="hub-search">
          <input type="search" placeholder="Buscar proyectos, creadores, tags..." aria-label="Buscar proyectos" />
        </div>
        <div className="hub-topbar__actions">
          <button type="button" className="hub-search-toggle" aria-label="Buscar">
            <svg viewBox="0 0 256 256" aria-hidden="true">
              <rect width="256" height="256" fill="none" />
              <circle
                cx="116"
                cy="116"
                r="84"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
              <line
                x1="175.39356"
                y1="175.40039"
                x2="223.99414"
                y2="224.00098"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
            </svg>
          </button>
          <Link className="hub-upload-button" href="/visuales">
            Subir proyecto
          </Link>
          <div className="hub-account-menu" ref={menuRef}>
            <button
              type="button"
              className="visuales-avatar visuales-avatar--button"
              aria-label="Abrir opciones de cuenta"
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={sessionUser === undefined}
            >
              <span suppressHydrationWarning>{displayAvatarLetter}</span>
            </button>
            {menuOpen ? (
              <div className="hub-account-menu__panel">
                <div className="hub-account-menu__status">
                  Estado sesion: {sessionUser ? "Activa" : "No sesion"}
                </div>
                {username ? (
                  <div className="hub-account-menu__profile">
                    <div className="hub-account-menu__name">{displayName ?? username}</div>
                    <div className="hub-account-menu__handle">@{username}</div>
                  </div>
                ) : null}
                {username ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleMyCabina();
                      }}
                    >
                      Mi estudio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleSettings();
                      }}
                    >
                      Ajustes
                    </button>
                  </>
                ) : null}
                {sessionUser ? (
                  <>
                    <button type="button" onClick={handleSwitchAccount}>
                      Cambiar cuenta
                    </button>
                    <button type="button" onClick={handleSignOut}>
                      Cerrar sesion
                    </button>
                  </>
                ) : (
                  <Link href="/visuales/auth" onClick={() => setMenuOpen(false)}>
                    Acceder
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <main className="hub-main">
        <section className="hub-project-view">
          {loading ? (
            <div className="hub-project-view__skeleton" aria-hidden>
              <div className="hub-project-view__player hub-project-view__player--skeleton" />
              <div className="hub-project-view__info hub-project-view__info--skeleton">
                <div className="hub-project-view__skeleton-line hub-project-view__skeleton-line--title" />
                <div className="hub-project-view__skeleton-line" />
                <div className="hub-project-view__skeleton-line hub-project-view__skeleton-line--short" />
              </div>
            </div>
          ) : null}
          {error ? <div className="hub-project-view__state">No se encontro el proyecto.</div> : null}
          {project ? (
            <>
              <div className={`hub-project-view__player${mediaLoaded ? " is-loaded" : ""}`}>
                {project.type === "video" ? (
                  <video
                    src={project.media_url ?? ""}
                    controls
                    playsInline
                    onLoadedData={() => setMediaLoaded(true)}
                    onLoadedMetadata={() => setMediaLoaded(true)}
                    onCanPlay={() => setMediaLoaded(true)}
                  />
                ) : (
                  <img
                    src={project.media_url ?? ""}
                    alt={project.title ?? "Proyecto"}
                    onLoad={() => setMediaLoaded(true)}
                  />
                )}
              </div>
              <div className="hub-project-view__info">
                <h1>{project.title ?? "Proyecto"}</h1>
                <div className="hub-project-view__meta">
                  <span>{project.type ?? "contenido"}</span>
                  {projectStats ? <span>{formatCompactMetric(projectStats.views_count)} vistas</span> : null}
                  {createdLabel ? <span>{createdLabel}</span> : null}
                </div>
                {project.description ? <p>{project.description}</p> : <p>Sin descripcion.</p>}
              </div>
              <div className="hub-project-view__more">
                <div className="hub-project-view__column">
                  <div className="hub-project-view__column-head">
                    <h2>Mas de este creador</h2>
                    <span>{creatorProjects.length}</span>
                  </div>
                  {relatedLoading && creatorProjects.length === 0 ? (
                    <div className="hub-project-view__empty">Cargando proyectos...</div>
                  ) : null}
                  {!relatedLoading && creatorProjects.length === 0 ? (
                    <div className="hub-project-view__empty">No hay mas proyectos.</div>
                  ) : null}
                  {creatorProjects.length > 0 ? (
                    <div className="hub-project-view__grid">
                      {creatorProjects.map((item) => (
                        <Link key={item.id} className="hub-project-view__card" href={`/visuales/proyecto/${item.id}`} prefetch>
                          <div className="hub-project-view__thumb">
                            {item.type === "video" ? (
                              <video
                                src={item.media_url ?? ""}
                                muted
                                playsInline
                                preload="metadata"
                                controls={false}
                                disablePictureInPicture
                                disableRemotePlayback
                                controlsList="nodownload noplaybackrate noremoteplayback"
                              />
                            ) : (
                              <img src={item.media_url ?? ""} alt={item.title ?? "Proyecto"} />
                            )}
                          </div>
                          <div className="hub-project-view__card-meta">
                            <h3>{item.title ?? "Proyecto"}</h3>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="hub-project-view__column">
                  <div className="hub-project-view__column-head">
                    <h2>Por descubrir</h2>
                    <span>{discoverProjects.length}</span>
                  </div>
                  {relatedLoading && discoverProjects.length === 0 ? (
                    <div className="hub-project-view__empty">Cargando proyectos...</div>
                  ) : null}
                  {!relatedLoading && discoverProjects.length === 0 ? (
                    <div className="hub-project-view__empty">Sin sugerencias por ahora.</div>
                  ) : null}
                  {discoverProjects.length > 0 ? (
                    <div className="hub-project-view__grid">
                      {discoverProjects.map((item) => (
                        <Link key={item.id} className="hub-project-view__card" href={`/visuales/proyecto/${item.id}`} prefetch>
                          <div className="hub-project-view__thumb">
                            {item.type === "video" ? (
                              <video
                                src={item.media_url ?? ""}
                                muted
                                playsInline
                                preload="metadata"
                                controls={false}
                                disablePictureInPicture
                                disableRemotePlayback
                                controlsList="nodownload noplaybackrate noremoteplayback"
                              />
                            ) : (
                              <img src={item.media_url ?? ""} alt={item.title ?? "Proyecto"} />
                            )}
                          </div>
                          <div className="hub-project-view__card-meta">
                            <h3>{item.title ?? "Proyecto"}</h3>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </SiteShell>
  );
}
