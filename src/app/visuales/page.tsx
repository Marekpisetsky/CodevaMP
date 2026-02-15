/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../components/site-shell";
import { fetchProjectStatsMap, formatCompactMetric, getProjectStats, type ProjectStats } from "../lib/project-stats";
import { supabase } from "../lib/supabase";
import { useVisualesIdentity } from "./use-visuales-identity";

export default function VisualesHubPage() {
  const FEED_CACHE_KEY = "visuales:feed:v1";
  const FEED_CACHE_TTL_MS = 90_000;
  const HERO_ONBOARDING_KEY = "visuales:hero-onboarding-seen:v1";
  const router = useRouter();
  const { sessionUser, username, displayName, displayAvatarLetter, applyIdentity } = useVisualesIdentity();

  const getInitial = (value: string | null) => {
    const cleaned = (value ?? "").trim().replace(/^@+/, "");
    const match = cleaned.match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "";
  };
  type ProjectItem = {
    id: string;
    title: string | null;
    description: string | null;
    type: string | null;
    media_url: string | null;
    user_id: string | null;
    profiles: { username: string | null; display_name: string | null } | null;
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("inicio");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectStatsMap, setProjectStatsMap] = useState<Record<string, ProjectStats>>({});
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsPage, setProjectsPage] = useState(0);
  const [projectsHasMore, setProjectsHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showOnboardingHero, setShowOnboardingHero] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement | null>(null);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const inicioRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);
  const prefetchedProjectIdsRef = useRef<Set<string>>(new Set());
  const lastStatsKeyRef = useRef<string>("");

  type FeedCache = {
    ts: number;
    page: number;
    hasMore: boolean;
    projects: ProjectItem[];
  };

  useEffect(() => {
    if (!menuOpen && !uploadMenuOpen) {
      return;
    }
    const handleOutside = (event: MouseEvent) => {
      if (!event.target) {
        return;
      }
      const target = event.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      if (uploadMenuRef.current && uploadMenuRef.current.contains(target)) {
        return;
      }
      setMenuOpen(false);
      setUploadMenuOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
    };
  }, [menuOpen, uploadMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(min-width: 1200px)");
    const updateViewport = () => setIsDesktopViewport(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(HERO_ONBOARDING_KEY) === "1";
      if (!seen) {
        localStorage.setItem(HERO_ONBOARDING_KEY, "1");
      }
      setShowOnboardingHero(!seen);
    } catch {
      // If storage is unavailable, keep onboarding visible.
      setShowOnboardingHero(true);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FEED_CACHE_KEY);
      if (!raw) {
        return;
      }
      const cached = JSON.parse(raw) as FeedCache;
      if (!cached?.projects?.length) {
        return;
      }
      if (Date.now() - cached.ts > FEED_CACHE_TTL_MS) {
        sessionStorage.removeItem(FEED_CACHE_KEY);
        return;
      }
      setProjects(cached.projects);
      setProjectsPage(cached.page);
      setProjectsHasMore(cached.hasMore);
      setInitialLoaded(true);
    } catch {
      // Ignore cache parse/storage errors.
    }
  }, []);

  useEffect(() => {
    if (!sessionUser || username) {
      return;
    }
    const owned = projects.find((project) => project.user_id === sessionUser && project.profiles?.username);
    if (!owned?.profiles?.username) {
      return;
    }
    const nextUsername = owned.profiles.username;
    const nextInitial = getInitial(nextUsername);
    applyIdentity({ username: nextUsername, avatarInitial: nextInitial, storedAvatarLetter: nextInitial });
  }, [applyIdentity, projects, sessionUser, username]);

  const loadProjects = useCallback(
    async (page: number) => {
      if (!supabase) {
        setProjectsLoading(false);
        setInitialLoaded(true);
        return;
      }
      if (loadingRef.current) {
        return;
      }
      const pageSize = 12;
      loadingRef.current = true;
      setProjectsLoading(true);
      try {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, description, type, media_url, user_id")
          .order("created_at", { ascending: false })
          .range(from, to);
        if (error) {
          return;
        }
        const baseProjects = (data as ProjectItem[]) ?? [];
        const ids = Array.from(new Set(baseProjects.map((item) => item.user_id).filter(Boolean))) as string[];
        const profileMap = new Map<string, { username: string | null; display_name: string | null }>();
        if (ids.length) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, display_name")
            .in("id", ids);
          (profilesData ?? []).forEach((profile) => {
            profileMap.set(profile.id, {
              username: profile.username ?? null,
              display_name: profile.display_name ?? null,
            });
          });
        }
        const merged = baseProjects.map((item) => ({
          ...item,
          profiles: item.user_id ? profileMap.get(item.user_id) ?? null : null,
        }));
        setProjects((prev) => (page === 0 ? (merged as ProjectItem[]) : [...prev, ...(merged as ProjectItem[])]));
        setProjectsHasMore(baseProjects.length === pageSize);
      } finally {
        setProjectsLoading(false);
        loadingRef.current = false;
        if (page === 0) {
          setInitialLoaded(true);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadProjects(0);
  }, [loadProjects]);

  useEffect(() => {
    if (!initialLoaded || projects.length === 0) {
      return;
    }
    try {
      const cache: FeedCache = {
        ts: Date.now(),
        page: projectsPage,
        hasMore: projectsHasMore,
        projects,
      };
      sessionStorage.setItem(FEED_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore storage write errors.
    }
  }, [initialLoaded, projects, projectsHasMore, projectsPage]);

  useEffect(() => {
    const topProjects = projects.slice(0, 6);
    topProjects.forEach((project) => {
      if (prefetchedProjectIdsRef.current.has(project.id)) {
        return;
      }
      prefetchedProjectIdsRef.current.add(project.id);
      router.prefetch(`/visuales/proyecto/${project.id}`);
    });
  }, [projects, router]);

  useEffect(() => {
    let active = true;
    const ids = projects.map((project) => project.id).filter(Boolean);
    if (ids.length === 0) {
      lastStatsKeyRef.current = "";
      setProjectStatsMap({});
      return;
    }
    const statsKey = ids.join(",");
    if (lastStatsKeyRef.current === statsKey) {
      return;
    }
    lastStatsKeyRef.current = statsKey;
    fetchProjectStatsMap(ids).then((stats) => {
      if (!active) {
        return;
      }
      setProjectStatsMap(stats);
    });
    return () => {
      active = false;
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!activeType) {
      return projects;
    }
    return projects.filter((project) => project.type === activeType);
  }, [activeType, projects]);

  const emptyStateMessage = useMemo(() => {
    if (activeNav === "explorar") {
      return "No hay proyectos para explorar aun.";
    }
    if (activeNav === "directos") {
      return "No hay proyectos en video todavia.";
    }
    if (activeNav === "suscripciones") {
      return "No hay animaciones disponibles por ahora.";
    }
    if (activeNav === "historial") {
      return "Aun no tienes proyectos vistos.";
    }
    return "No hay proyectos publicados aun.";
  }, [activeNav]);

  const isFeedEmpty = initialLoaded && !projectsLoading && filteredProjects.length === 0;
  const isInitialSkeleton = !initialLoaded && projects.length === 0;
  const isFeedBootLoading = projectsLoading && filteredProjects.length === 0;
  const shouldShowSkeletonGrid = isInitialSkeleton || isFeedBootLoading;
  const shouldShowBootSkeleton = shouldShowSkeletonGrid;
  const shouldShowHero = isDesktopViewport || showOnboardingHero;
  const hasFeedContent = !projectsLoading && filteredProjects.length > 0;

  const handleNavClick = (next: string) => {
    if (next !== "explorar") {
      searchInputRef.current?.blur();
    }
    setActiveNav(next);
    if (next === "directos") {
      setActiveType("video");
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next === "suscripciones") {
      setActiveType("animacion");
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next === "historial") {
      setActiveType("imagen");
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next === "explorar") {
      setActiveType(null);
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next === "inicio") {
      setActiveType(null);
      inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavPointerDown = (next: string) => {
    if (next !== "explorar") {
      searchInputRef.current?.blur();
    }
    setActiveNav(next);
  };

  useEffect(() => {
    if (!feedSentinelRef.current) {
      return;
    }
    const sentinel = feedSentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && projectsHasMore && !projectsLoading) {
          const nextPage = projectsPage + 1;
          setProjectsPage(nextPage);
          loadProjects(nextPage);
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadProjects, projectsHasMore, projectsLoading, projectsPage]);

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

  const goToStudioIntent = (intent: "upload" | "publish") => {
    const target = username ? `/visuales/estudio/@${username}?intent=${intent}` : "/visuales/app";
    if (!sessionUser) {
      router.push(`/visuales/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (!username) {
      router.push("/visuales/auth");
      return;
    }
    router.push(target);
  };

  const handleCreatePost = () => {
    goToStudioIntent("publish");
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

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-hub" brandHref="/visuales">
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
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Buscar proyectos, creadores, tags..."
            aria-label="Buscar proyectos"
          />
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
          <div className="hub-upload-menu" ref={uploadMenuRef}>
            <button
              type="button"
              className="hub-upload-button"
              aria-expanded={uploadMenuOpen}
              aria-haspopup="true"
              onClick={() => {
                setUploadMenuOpen((prev) => !prev);
                setMenuOpen(false);
              }}
            >
              Subir proyecto
            </button>
            {uploadMenuOpen ? (
              <div className="hub-upload-menu__panel">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    goToStudioIntent("upload");
                  }}
                >
                  Subir archivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    goToStudioIntent("publish");
                  }}
                >
                  Crear publicacion
                </button>
              </div>
            ) : null}
          </div>
          <div className="hub-account-menu" ref={menuRef}>
            <button
              type="button"
              className="visuales-avatar visuales-avatar--button"
              aria-label="Abrir opciones de cuenta"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setUploadMenuOpen(false);
              }}
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

      <aside className="hub-sidebar">
        <div className="hub-nav-row">
          <button
            type="button"
            className="hub-nav-scroll hub-nav-scroll--left"
            aria-label="Desplazar navegacion a la izquierda"
            onClick={() => navScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
          >
            <span aria-hidden>{"<"}</span>
          </button>
          <nav className="hub-nav" ref={navScrollRef}>
            <button
              type="button"
              className={activeNav === "inicio" ? "active" : ""}
              onPointerDown={() => handleNavPointerDown("inicio")}
              onClick={() => handleNavClick("inicio")}
            >
              Inicio
            </button>
            <button
              type="button"
              className={activeNav === "explorar" ? "active" : ""}
              onPointerDown={() => handleNavPointerDown("explorar")}
              onClick={() => handleNavClick("explorar")}
            >
              Explorar
            </button>
            <button
              type="button"
              className={activeNav === "suscripciones" ? "active" : ""}
              onPointerDown={() => handleNavPointerDown("suscripciones")}
              onClick={() => handleNavClick("suscripciones")}
            >
              Suscripciones
            </button>
            <button
              type="button"
              className={activeNav === "directos" ? "active" : ""}
              onPointerDown={() => handleNavPointerDown("directos")}
              onClick={() => handleNavClick("directos")}
            >
              Directos
            </button>
            <button
              type="button"
              className={activeNav === "historial" ? "active" : ""}
              onPointerDown={() => handleNavPointerDown("historial")}
              onClick={() => handleNavClick("historial")}
            >
              Historial
            </button>
          </nav>
          <button
            type="button"
            className="hub-nav-scroll hub-nav-scroll--right"
            aria-label="Desplazar navegacion a la derecha"
            onClick={() => navScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
          >
            <span aria-hidden>{">"}</span>
          </button>
        </div>
        <div className="hub-types">
          <p>Filtrar por tipo</p>
          <div className="hub-chip-row">
            {[
              { id: "imagen", label: "Imagen" },
              { id: "video", label: "Video" },
              { id: "animacion", label: "Animacion" },
              { id: "interactivo", label: "Interactivo" },
            ].map((chip) => (
              <button
                type="button"
                key={chip.id}
                className={activeType === chip.id ? "active" : ""}
                onClick={() => setActiveType(activeType === chip.id ? null : chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className={`hub-main ${hasFeedContent ? "hub-main--content-live" : ""}`}>
        <div ref={inicioRef} className="hub-anchor" />
        {shouldShowBootSkeleton ? (
          <>
            {shouldShowHero ? (
              <section className="hub-hero hub-hero--skeleton hub-enter" aria-hidden>
                <div className="hub-skel-copy">
                  <span className="hub-skel-line hub-skel-line--eyebrow" />
                  <span className="hub-skel-line hub-skel-line--title" />
                  <span className="hub-skel-line hub-skel-line--sub" />
                  <div className="hub-skel-actions">
                    <span className="hub-skel-pill" />
                    <span className="hub-skel-pill hub-skel-pill--ghost" />
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <>
            {shouldShowHero ? (
              <section className="hub-hero hub-enter">
                <div>
                  <p className="hub-hero__eyebrow">Comunidad Visuales</p>
                  <h1>Comparte tu proyecto con una comunidad que impulsa creadores.</h1>
                  <p className="hub-hero__sub">
                    Sube en minutos, recibe feedback y conecta con personas que valoran tu trabajo creativo.
                  </p>
                  <div className="hub-hero__actions">
                    <button type="button" className="hub-hero__cta" onClick={handleCreatePost}>
                      Subir mi primer proyecto
                    </button>
                    <button type="button" className="hub-hero__ghost" onClick={() => handleNavClick("explorar")}>
                      Ver comunidad
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
            {shouldShowHero && isFeedEmpty ? (
              <section className="hub-quick-strip hub-enter hub-enter--2" aria-label="Inicio rapido">
                <article className="hub-quick-strip__card">
                  <strong>1. Sube tu archivo</strong>
                  <span>Imagen o video en segundos.</span>
                </article>
                <article className="hub-quick-strip__card">
                  <strong>2. Ajusta metadata</strong>
                  <span>Titulo, descripcion y categoria.</span>
                </article>
                <article className="hub-quick-strip__card">
                  <strong>3. Publica y comparte</strong>
                  <span>Distribucion inmediata desde tu estudio.</span>
                </article>
              </section>
            ) : null}
          </>
        )}
        <section className={`hub-feed ${shouldShowSkeletonGrid ? "is-loading" : ""}`} ref={feedRef}>
          {shouldShowSkeletonGrid ? (
            <div className="hub-feed__grid hub-feed__grid--skeleton" aria-hidden>
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="hub-card hub-card--skeleton">
                  <div className="hub-card__media" />
                  <div className="hub-card__meta">
                    <div className="hub-card__title">
                      <span className="hub-card__avatar" />
                      <div>
                        <div className="hub-card__line" />
                        <div className="hub-card__line hub-card__line--short" />
                      </div>
                    </div>
                    <div className="hub-card__line hub-card__line--wide" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!projectsLoading && filteredProjects.length > 0 ? (
            <div className="hub-feed__grid hub-enter hub-enter--2">
              {filteredProjects.map((project, index) => {
                const stats = getProjectStats(projectStatsMap, project.id);
                return (
                <Link
                  key={project.id}
                  href={`/visuales/proyecto/${project.id}`}
                  className="hub-card hub-enter hub-feed-card"
                  style={{ animationDelay: `${Math.min(index * 24, 220)}ms` }}
                  aria-label={`Abrir ${project.title ?? "proyecto"}`}
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                >
                  <div
                    className="hub-card__media"
                    onMouseEnter={(event) => {
                      const vid = event.currentTarget.querySelector("video");
                      if (vid) {
                        try {
                          const playPromise = vid.play();
                          if (playPromise && typeof playPromise.catch === "function") {
                            playPromise.catch(() => undefined);
                          }
                        } catch {
                          // ignore autoplay restrictions
                        }
                      }
                    }}
                    onMouseLeave={(event) => {
                      const vid = event.currentTarget.querySelector("video");
                      if (vid) {
                        vid.pause();
                        vid.currentTime = 0;
                      }
                    }}
                    onDragStart={(event) => event.preventDefault()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => event.preventDefault()}
                  >
                    {project.type === "video" ? (
                      <video
                        src={project.media_url ?? ""}
                        muted
                        playsInline
                        preload="metadata"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        tabIndex={-1}
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                      />
                    ) : (
                      <img
                        src={project.media_url ?? ""}
                        alt={project.title ?? "Proyecto"}
                        loading={index < 6 ? "eager" : "lazy"}
                        fetchPriority={index < 6 ? "high" : "auto"}
                        decoding="async"
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                      />
                    )}
                  </div>
                    <div className="hub-card__meta">
                      <div className="hub-card__title">
                        <span className="hub-card__avatar">
                          {getInitial(project.profiles?.username ?? project.profiles?.display_name ?? null) || "<"}
                        </span>
                        <div>
                          <h3>{project.title ?? "Proyecto"}</h3>
                          <p>
                            @{(project.profiles?.username ?? "creador").replace(/^@+/, "")} -{" "}
                            {formatCompactMetric(stats.views_count)} vistas
                          </p>
                        </div>
                      </div>
                      <p>{project.description ?? ""}</p>
                    </div>
                </Link>
                );
              })}
            </div>
          ) : null}
          {isFeedEmpty ? (
            <div className="hub-feed-empty hub-enter hub-enter--2">
              <div className="hub-feed-empty__icon" aria-hidden>
                VS
              </div>
              <h3>Aun no hay contenido publicado</h3>
              <p>{emptyStateMessage}</p>
              <div className="hub-feed-empty__actions">
                <button type="button" onClick={handleCreatePost}>
                  Subir primer proyecto
                </button>
                <button type="button" className="hub-feed-empty__ghost" onClick={() => handleNavClick("explorar")}>
                  Ver secciones
                </button>
              </div>
              <div className="hub-feed-empty__samples" aria-hidden>
                <article className="hub-feed-empty__sample">
                  <div className="hub-feed-empty__sample-media" />
                  <div className="hub-feed-empty__sample-copy">
                    <strong>Demo Visual 01</strong>
                    <span>Portada, trailer y metadata</span>
                  </div>
                </article>
                <article className="hub-feed-empty__sample">
                  <div className="hub-feed-empty__sample-media" />
                  <div className="hub-feed-empty__sample-copy">
                    <strong>Demo Visual 02</strong>
                    <span>Publicacion lista para compartir</span>
                  </div>
                </article>
              </div>
            </div>
          ) : null}
          <div ref={feedSentinelRef} className="hub-feed__sentinel" />
        </section>
      </main>
    </SiteShell>
  );
}
