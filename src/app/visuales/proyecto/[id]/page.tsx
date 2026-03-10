/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteShell from "../../../components/site-shell";
import {
  fetchProjectStatsMap,
  formatCompactMetric,
  getOrCreateViewerKey,
  getProjectStats,
  recordProjectView,
  type ProjectStats,
} from "../../../lib/project-stats";
import { supabase } from "../../../lib/supabase";
import { useVisualesIdentity } from "../../use-visuales-identity";
import { useUiLanguage } from "@/shared/i18n/ui-language";

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

const resolveMediaUrl = (value: string | null | undefined) => (value ?? "").trim();

export default function VisualesProyectoPage() {
  const router = useRouter();
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);
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
  const viewedProjectIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    if (!projectId) {
      setError(isEs ? "Proyecto invalido." : "Invalid project.");
      setLoading(false);
      return;
    }
    if (!supabase) {
      setError(isEs ? "Supabase no esta configurado." : "Supabase is not configured.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    supabase
      .from("projects")
      .select("id, title, description, type, media_url, created_at, user_id")
      .eq("id", projectId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!active) {
          return;
        }
        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }
        setProject(data as ProjectRecord);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, isEs]);

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
      if (!viewedProjectIdsRef.current.has(project.id)) {
        viewedProjectIdsRef.current.add(project.id);
        await recordProjectView(project.id, {
          viewerKey: getOrCreateViewerKey(),
          cooldownSeconds: 45,
        });
      }
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
      router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}`);
      return;
    }
    const target = `/visuales/proyecto/${projectId ?? ""}`;
    router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
  };

  const handleSettings = () => {
    if (sessionUser === undefined) {
      return;
    }
    if (!sessionUser) {
      const target = username ? `/visuales/estudio/@${username}#ajustes` : "/visuales/app";
      router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}#ajustes`);
      return;
    }
    const target = `/visuales/proyecto/${projectId ?? ""}`;
    router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
  };

  const createdLabel = project?.created_at
    ? new Date(project.created_at).toLocaleDateString(isEs ? "es-ES" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const projectMediaUrl = resolveMediaUrl(project?.media_url);

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-hub visuales-hub--single" brandHref="/visuales">
      <div className="hub-topbar">
        <div className="hub-brand">
          <Link href="/visuales">
            <span className="hub-brand__badge">VS</span>
            <span className="hub-brand__text">
              <span className="hub-brand__title">Visuales</span>
              <span className="hub-brand__subtitle">{tx("Estudio creativo", "Creative studio")}</span>
            </span>
          </Link>
        </div>
        <div className="hub-search">
          <input
            type="search"
            placeholder={tx("Buscar proyectos, creadores, tags...", "Search projects, creators, tags...")}
            aria-label={tx("Buscar proyectos", "Search projects")}
          />
        </div>
        <div className="hub-topbar__actions">
          <button type="button" className="hub-search-toggle" aria-label={tx("Buscar", "Search")}>
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
            {tx("Subir proyecto", "Upload project")}
          </Link>
          <div className="hub-account-menu" ref={menuRef}>
            <button
              type="button"
              className="visuales-avatar visuales-avatar--button"
              aria-label={tx("Abrir opciones de cuenta", "Open account options")}
              onClick={() => setMenuOpen((prev) => !prev)}
              disabled={sessionUser === undefined}
            >
              <span suppressHydrationWarning>{displayAvatarLetter}</span>
            </button>
            {menuOpen ? (
              <div className="hub-account-menu__panel">
                <div className="hub-account-menu__status">
                  {tx("Estado sesion", "Session status")}: {sessionUser ? tx("Activa", "Active") : tx("Sin sesion", "Signed out")}
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
                      {tx("Mi estudio", "My studio")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleSettings();
                      }}
                    >
                      {tx("Ajustes", "Settings")}
                    </button>
                  </>
                ) : null}
                {sessionUser ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUiLanguage(language === "es" ? "en" : "es");
                      }}
                    >
                      {tx("Idioma", "Language")}: {language.toUpperCase()}
                    </button>
                    <button type="button" onClick={handleSwitchAccount}>
                      {tx("Cambiar cuenta", "Switch account")}
                    </button>
                    <button type="button" onClick={handleSignOut}>
                      {tx("Cerrar sesion", "Sign out")}
                    </button>
                  </>
                ) : (
                  <Link href={`/auth?returnTo=${encodeURIComponent(`/visuales/proyecto/${projectId ?? ""}`)}`} onClick={() => setMenuOpen(false)}>
                    {tx("Acceder", "Sign in")}
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
          {error ? <div className="hub-project-view__state">{tx("No se encontro el proyecto.", "Project not found.")}</div> : null}
          {project ? (
            <>
              <div className={`hub-project-view__player${mediaLoaded ? " is-loaded" : ""}`}>
                {project.type === "video" && projectMediaUrl ? (
                  <video
                    src={projectMediaUrl}
                    controls
                    playsInline
                    onLoadedData={() => setMediaLoaded(true)}
                    onLoadedMetadata={() => setMediaLoaded(true)}
                    onCanPlay={() => setMediaLoaded(true)}
                  />
                ) : projectMediaUrl ? (
                  <img
                    src={projectMediaUrl}
                    alt={project.title ?? tx("Proyecto", "Project")}
                    onLoad={() => setMediaLoaded(true)}
                  />
                ) : (
                  <div className="hub-project-view__state">{tx("Vista previa no disponible.", "Preview unavailable.")}</div>
                )}
              </div>
              <div className="hub-project-view__info">
                <h1>{project.title ?? tx("Proyecto", "Project")}</h1>
                <div className="hub-project-view__meta">
                  <span>{project.type ?? tx("contenido", "content")}</span>
                  {projectStats ? <span>{formatCompactMetric(projectStats.views_count)} {tx("vistas", "views")}</span> : null}
                  {createdLabel ? <span>{createdLabel}</span> : null}
                </div>
                {project.description ? <p>{project.description}</p> : <p>{tx("Sin descripcion.", "No description.")}</p>}
              </div>
              <div className="hub-project-view__more">
                <div className="hub-project-view__column">
                  <div className="hub-project-view__column-head">
                    <h2>{tx("Mas de este creador", "More from this creator")}</h2>
                    <span>{creatorProjects.length}</span>
                  </div>
                  {relatedLoading && creatorProjects.length === 0 ? (
                    <div className="hub-project-view__empty">{tx("Cargando proyectos...", "Loading projects...")}</div>
                  ) : null}
                  {!relatedLoading && creatorProjects.length === 0 ? (
                    <div className="hub-project-view__empty">{tx("No hay mas proyectos.", "No more projects.")}</div>
                  ) : null}
                  {creatorProjects.length > 0 ? (
                    <div className="hub-project-view__grid">
                      {creatorProjects.map((item) => (
                        <Link key={item.id} className="hub-project-view__card" href={`/visuales/proyecto/${item.id}`} prefetch>
                          {(() => {
                            const mediaUrl = resolveMediaUrl(item.media_url);
                            return (
                              <div className="hub-project-view__thumb">
                                {item.type === "video" && mediaUrl ? (
                                  <video
                                    src={mediaUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    controls={false}
                                    disablePictureInPicture
                                    disableRemotePlayback
                                    controlsList="nodownload noplaybackrate noremoteplayback"
                                  />
                                ) : mediaUrl ? (
                                  <img src={mediaUrl} alt={item.title ?? tx("Proyecto", "Project")} />
                                ) : (
                                  <div className="hub-project-view__empty">{tx("Sin media", "No media")}</div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="hub-project-view__card-meta">
                            <h3>{item.title ?? tx("Proyecto", "Project")}</h3>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="hub-project-view__column">
                  <div className="hub-project-view__column-head">
                    <h2>{tx("Por descubrir", "Discover more")}</h2>
                    <span>{discoverProjects.length}</span>
                  </div>
                  {relatedLoading && discoverProjects.length === 0 ? (
                    <div className="hub-project-view__empty">{tx("Cargando proyectos...", "Loading projects...")}</div>
                  ) : null}
                  {!relatedLoading && discoverProjects.length === 0 ? (
                    <div className="hub-project-view__empty">{tx("Sin sugerencias por ahora.", "No suggestions for now.")}</div>
                  ) : null}
                  {discoverProjects.length > 0 ? (
                    <div className="hub-project-view__grid">
                      {discoverProjects.map((item) => (
                        <Link key={item.id} className="hub-project-view__card" href={`/visuales/proyecto/${item.id}`} prefetch>
                          {(() => {
                            const mediaUrl = resolveMediaUrl(item.media_url);
                            return (
                              <div className="hub-project-view__thumb">
                                {item.type === "video" && mediaUrl ? (
                                  <video
                                    src={mediaUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    controls={false}
                                    disablePictureInPicture
                                    disableRemotePlayback
                                    controlsList="nodownload noplaybackrate noremoteplayback"
                                  />
                                ) : mediaUrl ? (
                                  <img src={mediaUrl} alt={item.title ?? tx("Proyecto", "Project")} />
                                ) : (
                                  <div className="hub-project-view__empty">{tx("Sin media", "No media")}</div>
                                )}
                              </div>
                            );
                          })()}
                          <div className="hub-project-view__card-meta">
                            <h3>{item.title ?? tx("Proyecto", "Project")}</h3>
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
