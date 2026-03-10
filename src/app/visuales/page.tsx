/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../components/site-shell";
import { fetchProjectStatsMap, formatCompactMetric, getProjectStats, type ProjectStats } from "../lib/project-stats";
import { supabase } from "../lib/supabase";
import { useVisualesIdentity } from "./use-visuales-identity";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export default function VisualesHubPage() {
  const FEED_CACHE_KEY = "visuales:feed:v1";
  const FEED_CACHE_TTL_MS = 90_000;
  const HERO_ONBOARDING_KEY = "visuales:hero-onboarding-seen:v1";
  const TELEMETRY_CACHE_KEY = "visuales:telemetry:v1";
  const TELEMETRY_MAX_ITEMS = 200;
  const router = useRouter();
  const { sessionUser, username, displayName, displayAvatarLetter, applyIdentity } = useVisualesIdentity();
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);

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
  const [projectSort, setProjectSort] = useState<"recent" | "popular">("recent");
  const [projectSearch, setProjectSearch] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchProjects, setSearchProjects] = useState<ProjectItem[] | null>(null);
  const [searchingProjects, setSearchingProjects] = useState(false);
  const [mediaErrorIds, setMediaErrorIds] = useState<Set<string>>(new Set());
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
  const canHoverPreviewRef = useRef(true);
  const telemetryProbeRef = useRef<"unknown" | "ready" | "disabled">("unknown");
  const noResultsTrackKeyRef = useRef("");
  const normalizedProjectSearch = projectSearch
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const hasActiveSearch = normalizedProjectSearch.length > 0;
  const activeFilterCount = Number(Boolean(activeType)) + Number(hasActiveSearch) + Number(projectSort === "popular");

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
    if (!supabase) {
      setSearchProjects(null);
      setSearchingProjects(false);
      return;
    }
    const client = supabase;
    if (!hasActiveSearch) {
      setSearchProjects(null);
      setSearchingProjects(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearchingProjects(true);
      try {
        const like = `%${projectSearch.trim()}%`;
        const [projectTextResult, profileMatchResult] = await Promise.all([
          client
            .from("projects")
            .select("id, title, description, type, media_url, user_id")
            .or(`title.ilike.${like},description.ilike.${like},type.ilike.${like}`)
            .order("created_at", { ascending: false })
            .limit(48),
          client
            .from("profiles")
            .select("id")
            .or(`username.ilike.${like},display_name.ilike.${like}`)
            .limit(100),
        ]);
        const projectsByText = (projectTextResult.data as ProjectItem[]) ?? [];
        const matchingProfileIds = ((profileMatchResult.data ?? []).map((item) => item.id).filter(Boolean) ??
          []) as string[];

        let projectsByCreator: ProjectItem[] = [];
        if (matchingProfileIds.length > 0) {
          const { data } = await client
            .from("projects")
            .select("id, title, description, type, media_url, user_id")
            .in("user_id", matchingProfileIds)
            .order("created_at", { ascending: false })
            .limit(48);
          projectsByCreator = (data as ProjectItem[]) ?? [];
        }

        const deduped = Array.from(
          new Map([...projectsByText, ...projectsByCreator].map((project) => [project.id, project])).values()
        );
        const ids = Array.from(new Set(deduped.map((item) => item.user_id).filter(Boolean))) as string[];
        const profileMap = new Map<string, { username: string | null; display_name: string | null }>();
        if (ids.length) {
          const { data: profilesData } = await client
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
        if (!active) {
          return;
        }
        const merged = deduped.map((item) => ({
          ...item,
          profiles: item.user_id ? profileMap.get(item.user_id) ?? null : null,
        }));
        setSearchProjects(merged);
      } finally {
        if (active) {
          setSearchingProjects(false);
        }
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [hasActiveSearch, projectSearch]);

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
    const statsSource = searchProjects ?? projects;
    const ids = statsSource.map((project) => project.id).filter(Boolean);
    if (ids.length === 0) {
      lastStatsKeyRef.current = "";
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
      setProjectStatsMap((prev) => ({ ...prev, ...stats }));
    });
    return () => {
      active = false;
    };
  }, [projects, searchProjects]);

  const filteredProjects = useMemo(() => {
    const source = searchProjects ?? projects;
    const base = source.filter((project) => {
      if (activeType && project.type !== activeType) {
        return false;
      }
      if (!normalizedProjectSearch) {
        return true;
      }
      const searchable = [
        project.title,
        project.description,
        project.type,
        project.profiles?.username,
        project.profiles?.display_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return searchable.includes(normalizedProjectSearch);
    });
    if (projectSort === "popular") {
      return [...base].sort((a, b) => {
        const aViews = getProjectStats(projectStatsMap, a.id).views_count;
        const bViews = getProjectStats(projectStatsMap, b.id).views_count;
        return bViews - aViews;
      });
    }
    return base;
  }, [activeType, normalizedProjectSearch, projectSort, projectStatsMap, projects, searchProjects]);

  const emptyStateMessage = useMemo(() => {
    if (activeNav === "explorar") {
      return isEs ? "No hay proyectos para explorar aun." : "No projects to explore yet.";
    }
    if (activeNav === "directos") {
      return isEs ? "No hay proyectos en video todavia." : "No video projects yet.";
    }
    if (activeNav === "suscripciones") {
      return isEs ? "No hay animaciones disponibles por ahora." : "No animations available right now.";
    }
    if (activeNav === "historial") {
      return isEs ? "Aun no tienes proyectos vistos." : "You do not have viewed projects yet.";
    }
    return isEs ? "No hay proyectos publicados aun." : "No published projects yet.";
  }, [activeNav, isEs]);

  const isFeedEmpty = initialLoaded && !projectsLoading && filteredProjects.length === 0;
  const isInitialSkeleton = !initialLoaded && projects.length === 0;
  const isFeedBootLoading = projectsLoading && filteredProjects.length === 0;
  const shouldShowSkeletonGrid = isInitialSkeleton || isFeedBootLoading;
  const shouldShowBootSkeleton = shouldShowSkeletonGrid;
  const shouldShowHero = isDesktopViewport || showOnboardingHero;
  const hasFeedContent = !projectsLoading && filteredProjects.length > 0;
  const resultsLabel = hasActiveSearch
    ? isEs
      ? `${filteredProjects.length} resultado${filteredProjects.length === 1 ? "" : "s"}`
      : `${filteredProjects.length} result${filteredProjects.length === 1 ? "" : "s"}`
    : "";
  const showSearchSkeleton = searchingProjects && hasActiveSearch;

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
  const clearSearch = () => {
    setProjectSearch("");
    searchInputRef.current?.focus();
  };
  const resetAllFilters = () => {
    setActiveType(null);
    setProjectSort("recent");
    setProjectSearch("");
    setActiveNav("explorar");
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const trackTelemetry = useCallback(
    async (eventName: "project_card_click" | "search_no_results", payload: Record<string, unknown>) => {
      const envelope = {
        event: eventName,
        route: "/visuales",
        ts: new Date().toISOString(),
        user_id: sessionUser ?? null,
        payload: {
          ...payload,
          active_type: activeType,
          sort: projectSort,
          has_search: hasActiveSearch,
        },
      };
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(TELEMETRY_CACHE_KEY);
          const current = raw ? (JSON.parse(raw) as unknown[]) : [];
          const next = [...current, envelope].slice(-TELEMETRY_MAX_ITEMS);
          localStorage.setItem(TELEMETRY_CACHE_KEY, JSON.stringify(next));
        } catch {
          // Ignore telemetry cache write errors.
        }
      }
      if (!supabase || telemetryProbeRef.current === "disabled") {
        return;
      }
      const { error } = await supabase.from("telemetry_events").insert({
        event_name: envelope.event,
        route: envelope.route,
        user_id: envelope.user_id,
        payload: envelope.payload,
        created_at: envelope.ts,
      });
      if (error) {
        telemetryProbeRef.current = "disabled";
        return;
      }
      telemetryProbeRef.current = "ready";
    },
    [activeType, hasActiveSearch, projectSort, sessionUser]
  );
  const markMediaError = (projectId: string) => {
    setMediaErrorIds((prev) => {
      if (prev.has(projectId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  };

  useEffect(() => {
    if (!feedSentinelRef.current) {
      return;
    }
    const sentinel = feedSentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && projectsHasMore && !projectsLoading) {
          if (hasActiveSearch) {
            return;
          }
          const nextPage = projectsPage + 1;
          setProjectsPage(nextPage);
          loadProjects(nextPage);
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasActiveSearch, loadProjects, projectsHasMore, projectsLoading, projectsPage]);

  useEffect(() => {
    if (!hasActiveSearch || searchingProjects || filteredProjects.length !== 0) {
      return;
    }
    const query = projectSearch.trim().toLowerCase();
    if (!query) {
      return;
    }
    const trackKey = `${query}|${activeType ?? "all"}|${projectSort}`;
    if (noResultsTrackKeyRef.current === trackKey) {
      return;
    }
    noResultsTrackKeyRef.current = trackKey;
    void trackTelemetry("search_no_results", { query, results_count: 0 });
  }, [activeType, filteredProjects.length, hasActiveSearch, projectSearch, projectSort, searchingProjects, trackTelemetry]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      canHoverPreviewRef.current = mediaQuery.matches;
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

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
      router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (!username) {
      router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
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
      router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}`);
      return;
    }
    const target = "/visuales/app";
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
    const target = "/visuales/app";
    router.push(`/auth?returnTo=${encodeURIComponent(target)}`);
  };

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-hub" brandHref="/visuales" brandId="visuales">
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
            ref={searchInputRef}
            type="search"
            placeholder={tx("Buscar proyectos, creadores, tags...", "Search projects, creators, tags...")}
            aria-label={tx("Buscar proyectos", "Search projects")}
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
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
              {tx("Subir proyecto", "Upload project")}
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
                  {tx("Subir archivo", "Upload file")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    goToStudioIntent("publish");
                  }}
                >
                  {tx("Crear publicacion", "Create post")}
                </button>
              </div>
            ) : null}
          </div>
          <div className="hub-account-menu" ref={menuRef}>
            <button
              type="button"
              className="visuales-avatar visuales-avatar--button"
              aria-label={tx("Abrir opciones de cuenta", "Open account options")}
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
                  <Link href="/auth?returnTo=%2Fvisuales" onClick={() => setMenuOpen(false)}>
                    {tx("Acceder", "Sign in")}
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
            aria-label={tx("Desplazar navegacion a la izquierda", "Scroll navigation left")}
            onClick={() => navScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
          >
            <span aria-hidden>{"<"}</span>
          </button>
          <nav className="hub-nav" ref={navScrollRef}>
            <button
              type="button"
              className={activeNav === "inicio" ? "active" : ""}
              onClick={() => handleNavClick("inicio")}
            >
              {tx("Inicio", "Home")}
            </button>
            <button
              type="button"
              className={activeNav === "explorar" ? "active" : ""}
              onClick={() => handleNavClick("explorar")}
            >
              {tx("Explorar", "Explore")}
            </button>
            <button
              type="button"
              className={activeNav === "suscripciones" ? "active" : ""}
              onClick={() => handleNavClick("suscripciones")}
            >
              {tx("Suscripciones", "Subscriptions")}
            </button>
            <button
              type="button"
              className={activeNav === "directos" ? "active" : ""}
              onClick={() => handleNavClick("directos")}
            >
              {tx("Directos", "Live")}
            </button>
            <button
              type="button"
              className={activeNav === "historial" ? "active" : ""}
              onClick={() => handleNavClick("historial")}
            >
              {tx("Historial", "History")}
            </button>
          </nav>
          <button
            type="button"
            className="hub-nav-scroll hub-nav-scroll--right"
            aria-label={tx("Desplazar navegacion a la derecha", "Scroll navigation right")}
            onClick={() => navScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
          >
            <span aria-hidden>{">"}</span>
          </button>
        </div>
        <div className="hub-types">
          <p>{tx("Filtrar por tipo", "Filter by type")}</p>
          <div className="hub-chip-row">
            {[
              { id: "imagen", label: tx("Imagen", "Image") },
              { id: "video", label: "Video" },
              { id: "animacion", label: tx("Animacion", "Animation") },
              { id: "interactivo", label: tx("Interactivo", "Interactive") },
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
          <p>{tx("Ordenar", "Sort")}</p>
          <div className="hub-chip-row hub-chip-row--sort">
            <button
              type="button"
              className={projectSort === "recent" ? "active" : ""}
              onClick={() => setProjectSort("recent")}
            >
              {tx("Recientes", "Recent")}
            </button>
            <button
              type="button"
              className={projectSort === "popular" ? "active" : ""}
              onClick={() => setProjectSort("popular")}
            >
              {tx("Populares", "Popular")}
            </button>
          </div>
          {activeFilterCount > 0 ? (
            <button type="button" className="hub-types__clear" onClick={resetAllFilters}>
              {tx("Limpiar filtros", "Clear filters")} ({activeFilterCount})
            </button>
          ) : null}
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
                  <p className="hub-hero__eyebrow">{tx("Comunidad Visuales", "Visuales Community")}</p>
                  <h1>{tx("Comparte tu proyecto con una comunidad que impulsa creadores.", "Share your project with a community that empowers creators.")}</h1>
                  <p className="hub-hero__sub">
                    {tx(
                      "Sube en minutos, recibe feedback y conecta con personas que valoran tu trabajo creativo.",
                      "Upload in minutes, get feedback, and connect with people who value your creative work."
                    )}
                  </p>
                  <div className="hub-hero__actions">
                    <button type="button" className="hub-hero__cta" onClick={handleCreatePost}>
                      {tx("Subir mi primer proyecto", "Upload my first project")}
                    </button>
                    <button type="button" className="hub-hero__ghost" onClick={() => handleNavClick("explorar")}>
                      {tx("Ver comunidad", "View community")}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
            {shouldShowHero && isFeedEmpty ? (
              <section className="hub-quick-strip hub-enter hub-enter--2" aria-label={tx("Inicio rapido", "Quick start")}>
                <article className="hub-quick-strip__card">
                  <strong>{tx("1. Sube tu archivo", "1. Upload your file")}</strong>
                  <span>{tx("Imagen o video en segundos.", "Image or video in seconds.")}</span>
                </article>
                <article className="hub-quick-strip__card">
                  <strong>{tx("2. Ajusta metadata", "2. Adjust metadata")}</strong>
                  <span>{tx("Titulo, descripcion y categoria.", "Title, description, and category.")}</span>
                </article>
                <article className="hub-quick-strip__card">
                  <strong>{tx("3. Publica y comparte", "3. Publish and share")}</strong>
                  <span>{tx("Distribucion inmediata desde tu estudio.", "Instant distribution from your studio.")}</span>
                </article>
              </section>
            ) : null}
          </>
        )}
        <section className="hub-feed-status" aria-live="polite">
          {searchingProjects ? (
            <p className="hub-feed-status__searching">{tx("Buscando", "Searching")} &quot;{projectSearch.trim()}&quot;...</p>
          ) : hasActiveSearch ? (
            <p className="hub-feed-status__results">
              {resultsLabel} {tx("para", "for")} &quot;{projectSearch.trim()}&quot;
            </p>
          ) : (
            <p className="hub-feed-status__results">
              {projectSort === "popular" ? tx("Ordenado por populares", "Sorted by popular") : tx("Ordenado por recientes", "Sorted by recent")}
            </p>
          )}
          {hasActiveSearch ? (
            <button type="button" className="hub-feed-status__clear" onClick={clearSearch}>
              {tx("Limpiar busqueda", "Clear search")}
            </button>
          ) : null}
        </section>
        <section className={`hub-feed ${shouldShowSkeletonGrid ? "is-loading" : ""}`} ref={feedRef}>
          {showSearchSkeleton ? (
            <div className="hub-feed__grid hub-feed__grid--searching" aria-hidden>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`search-skeleton-${index}`} className="hub-card hub-card--skeleton">
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
                const mediaUrl = project.media_url?.trim() ?? "";
                return (
                <Link
                  key={project.id}
                  href={`/visuales/proyecto/${project.id}`}
                  className="hub-card hub-enter hub-feed-card"
                  style={{ animationDelay: `${Math.min(index * 24, 220)}ms` }}
                  aria-label={`${tx("Abrir", "Open")} ${project.title ?? tx("proyecto", "project")}`}
                  draggable={false}
                  onClick={() =>
                    void trackTelemetry("project_card_click", {
                      project_id: project.id,
                      project_type: project.type,
                      project_title: project.title,
                      rank: index + 1,
                    })
                  }
                >
                  <div
                    className="hub-card__media"
                    onMouseEnter={(event) => {
                      if (!canHoverPreviewRef.current) {
                        return;
                      }
                      const vid = event.currentTarget.querySelector("video");
                      if (vid) {
                        const allVideos = document.querySelectorAll<HTMLVideoElement>(".hub-card__media video");
                        allVideos.forEach((other) => {
                          if (other !== vid) {
                            other.pause();
                            other.currentTime = 0;
                          }
                        });
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
                  >
                    {mediaErrorIds.has(project.id) || !mediaUrl ? (
                      <div className="hub-card__media-fallback" aria-label={tx("Vista previa no disponible", "Preview unavailable")}>
                        <strong>{project.type ?? tx("Proyecto", "Project")}</strong>
                        <span>{project.title ?? tx("Vista previa no disponible", "Preview unavailable")}</span>
                      </div>
                    ) : project.type === "video" ? (
                      <video
                        src={mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        tabIndex={-1}
                        draggable={false}
                        onError={() => markMediaError(project.id)}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={project.title ?? tx("Proyecto", "Project")}
                        loading={index < 6 ? "eager" : "lazy"}
                        fetchPriority={index < 6 ? "high" : "auto"}
                        decoding="async"
                        draggable={false}
                        onError={() => markMediaError(project.id)}
                      />
                    )}
                  </div>
                    <div className="hub-card__meta">
                      <div className="hub-card__title">
                        <span className="hub-card__avatar">
                          {getInitial(project.profiles?.username ?? project.profiles?.display_name ?? null) || "<"}
                        </span>
                        <div>
                          <h3>{project.title ?? tx("Proyecto", "Project")}</h3>
                          <p>
                            @{(project.profiles?.username ?? tx("creador", "creator")).replace(/^@+/, "")} -{" "}
                            {formatCompactMetric(stats.views_count)} {tx("vistas", "views")}
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
          {isFeedEmpty && !searchingProjects ? (
            <div className="hub-feed-empty hub-enter hub-enter--2">
              <div className="hub-feed-empty__icon" aria-hidden>
                VS
              </div>
              <h3>{hasActiveSearch ? tx("No encontramos resultados", "No results found") : tx("Aun no hay contenido publicado", "No published content yet")}</h3>
              <p>
                {hasActiveSearch
                  ? tx(
                      `No hay coincidencias para "${projectSearch.trim()}". Prueba con otra palabra o limpia filtros.`,
                      `No matches for "${projectSearch.trim()}". Try another keyword or clear filters.`
                    )
                  : emptyStateMessage}
              </p>
              <div className="hub-feed-empty__actions">
                {hasActiveSearch ? (
                  <>
                    <button type="button" onClick={clearSearch}>
                      {tx("Limpiar busqueda", "Clear search")}
                    </button>
                    <button type="button" className="hub-feed-empty__ghost" onClick={resetAllFilters}>
                      {tx("Quitar filtros", "Remove filters")}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={handleCreatePost}>
                      {tx("Subir primer proyecto", "Upload first project")}
                    </button>
                    <button type="button" className="hub-feed-empty__ghost" onClick={() => handleNavClick("explorar")}>
                      {tx("Ver secciones", "View sections")}
                    </button>
                  </>
                )}
              </div>
              {!hasActiveSearch ? (
                <div className="hub-feed-empty__samples" aria-hidden>
                  <article className="hub-feed-empty__sample">
                    <div className="hub-feed-empty__sample-media" />
                    <div className="hub-feed-empty__sample-copy">
                      <strong>Demo Visual 01</strong>
                      <span>{tx("Portada, trailer y metadata", "Cover, trailer, and metadata")}</span>
                    </div>
                  </article>
                  <article className="hub-feed-empty__sample">
                    <div className="hub-feed-empty__sample-media" />
                    <div className="hub-feed-empty__sample-copy">
                      <strong>Demo Visual 02</strong>
                      <span>{tx("Publicacion lista para compartir", "Publication ready to share")}</span>
                    </div>
                  </article>
                </div>
              ) : null}
            </div>
          ) : null}
          <div ref={feedSentinelRef} className="hub-feed__sentinel" />
        </section>
      </main>
    </SiteShell>
  );
}
