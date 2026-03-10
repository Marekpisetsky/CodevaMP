"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import BannerLab from "@/app/dev/banner-lab";
import { scoreProjectLocal } from "@/app/lib/dev-engine";
import { ensureDevWasmRuntime } from "@/app/lib/dev-wasm-loader";
import {
  initialProjects,
  mapDevProjectRow,
  type DevProject,
  type DevProjectRow,
} from "@/app/lib/dev-projects";
import { formatCompactMetric } from "@/app/lib/project-stats";
import { ensureExplorerMembership } from "@/app/lib/product-memberships";
import { devSupabase as supabase } from "@/app/lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type StatusFilter = "all" | "idea" | "building" | "live";
type ViewMode = "gallery" | "graph" | "timeline";

type Copy = {
  [key: string]: string;
};

type ProjectStatsRow = {
  project_id: string;
  views_count: number | null;
};

type TechNode = {
  id: string;
  label: string;
  count: number;
};

type QualityCheck = {
  id: string;
  label: string;
  done: boolean;
};

type ReleaseGate = {
  canPublish: boolean;
  reasons: string[];
};

const collabPresets = {
  es: ["Frontend", "Backend", "AI/ML", "Diseno de juegos", "Embebidos", "Soporte no-code"],
  en: ["Frontend", "Backend", "AI/ML", "Game design", "Embedded", "No-code support"],
} as const;

const skeletonCards = Array.from({ length: 6 }, (_, index) => `dev-skeleton-${index}`);

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

function canEmbedDemo(value: string) {
  const url = value.trim();
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

function formatDevProjectsError(
  isEs: boolean,
  error: { message?: string; code?: string } | null | undefined
) {
  if (!error) return isEs ? "Error de base de datos en dev_projects." : "Database error in dev_projects.";
  if (
    error.code === "42P01" ||
    (error.message?.toLowerCase().includes("dev_projects") && error.message.toLowerCase().includes("not found"))
  ) {
    return isEs
      ? "Falta la tabla public.dev_projects. Ejecuta la ultima migracion de Supabase."
      : "Missing public.dev_projects table. Run the latest Supabase migration.";
  }
  return error.message || (isEs ? "Error de base de datos en dev_projects." : "Database error in dev_projects.");
}

function statusLabel(status: DevProject["status"], copy: Copy) {
  if (status === "building") return copy.statusBuildingLower;
  if (status === "live") return copy.statusLiveLower;
  return copy.statusIdeaLower;
}

function buildQualityChecks(project: DevProject, isEs: boolean): QualityCheck[] {
  return [
    {
      id: "title",
      label: isEs ? "Titulo claro" : "Clear title",
      done: project.title.trim().length >= 8,
    },
    {
      id: "summary",
      label: isEs ? "Resumen util" : "Useful summary",
      done: project.summary.trim().length >= 36,
    },
    {
      id: "stack",
      label: isEs ? "Stack definido" : "Defined stack",
      done: project.stack.trim().length >= 2,
    },
    {
      id: "proof",
      label: isEs ? "Demo o repo" : "Demo or repo",
      done: Boolean(project.demoUrl.trim() || project.repoUrl.trim()),
    },
  ];
}

function qualityScore(project: DevProject, isEs: boolean): number {
  const checks = buildQualityChecks(project, isEs);
  const pass = checks.filter((check) => check.done).length;
  return Math.round((pass / checks.length) * 100);
}

function buildReleaseGate(
  isEs: boolean,
  project: DevProject,
  quality: number,
  engine: number,
  views: number
): ReleaseGate {
  const reasons: string[] = [];
  if (quality < 75) {
    reasons.push(isEs ? "Checklist < 75%" : "Checklist < 75%");
  }
  if (engine < 70) {
    reasons.push(isEs ? "Engine < 70%" : "Engine < 70%");
  }
  if (!project.demoUrl.trim() && !project.repoUrl.trim()) {
    reasons.push(isEs ? "Falta demo o repo" : "Missing demo or repo");
  }
  if (views < 2) {
    reasons.push(isEs ? "Validacion insuficiente (2 vistas)" : "Insufficient validation (2 views)");
  }
  return {
    canPublish: reasons.length === 0,
    reasons,
  };
}

function parseStackTokens(stack: string): string[] {
  return stack
    .split(/[,+/|]/g)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 6);
}

function buildTechNodes(projects: DevProject[]): TechNode[] {
  const map = new Map<string, number>();
  for (const project of projects) {
    for (const token of parseStackTokens(project.stack)) {
      map.set(token, (map.get(token) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ id: label.toLowerCase(), label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "gallery";
  const saved = window.localStorage.getItem("codevamp.dev.viewMode");
  return saved === "graph" || saved === "timeline" || saved === "gallery" ? saved : "gallery";
}

function readStoredStatusFilter(): StatusFilter {
  if (typeof window === "undefined") return "all";
  const saved = window.localStorage.getItem("codevamp.dev.statusFilter");
  return saved === "idea" || saved === "building" || saved === "live" || saved === "all" ? saved : "all";
}

function readStoredQuery(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("codevamp.dev.query") || "";
}

export default function DevPage() {
  return (
    <Suspense
      fallback={
        <main className="dev-root dev-root--stable" data-brand="dev">
          <div className="dev-shell">
            <section className="dev-card">Cargando...</section>
          </div>
        </main>
      }
    >
      <DevPageContent />
    </Suspense>
  );
}

function DevPageContent() {
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const searchParams = useSearchParams();
  const publishedId = (searchParams.get("published") || "").trim();

  const t: Copy = {
    loading: isEs ? "Cargando entorno Dev..." : "Loading Dev environment...",
    inDev: isEs ? "En desarrollo" : "In development",
    published: isEs ? "Publicados" : "Published",
    devBrandTitle: "Dev",
    brandSubtitle: isEs ? "Unidad de producto y software" : "Product and software unit",
    signIn: isEs ? "Iniciar sesion" : "Sign in",
    signOut: isEs ? "Cerrar sesion" : "Sign out",
    language: language.toUpperCase(),
    heroKicker: isEs ? "CodevaMP / Dev" : "CodevaMP / Dev",
    heroTitle: isEs ? "Construye y publica software sin ruido" : "Build and ship software with less noise",
    heroCopy: isEs
      ? "Este espacio concentra backlog real, publicacion y colaboracion tecnica."
      : "This space centralizes real backlog, publishing, and technical collaboration.",
    openStudio: isEs ? "Abrir Dev Studio" : "Open Dev Studio",
    toggleComposer: isEs ? "1. Definir idea" : "1. Define idea",
    flowBuildAction: isEs ? "2. Construir en Studio" : "2. Build in Studio",
    flowMeasureAction: isEs ? "4. Medir publicados" : "4. Measure published",
    strategyLink: isEs ? "Ver estrategia" : "View strategy",
    metricsPublished: isEs ? "Publicados" : "Published",
    metricsBuilding: isEs ? "Construyendo" : "Building",
    metricsIdeas: isEs ? "Ideas" : "Ideas",
    metricsViews: isEs ? "Vistas" : "Views",
    metricsQuality: isEs ? "Calidad" : "Quality",
    metricsEngine: isEs ? "Engine" : "Engine",
    metricsCycle: isEs ? "Ciclo" : "Cycle",
    qualityChecklist: isEs ? "Checklist automatico" : "Auto checklist",
    releaseGateTitle: isEs ? "Gate de publicacion" : "Release gate",
    releaseGatePass: isEs ? "Aprobado para publicar" : "Approved for publish",
    publishBlocked: isEs
      ? "No cumple gate de publicacion."
      : "Release gate not satisfied.",
    daysLabel: isEs ? "dias" : "days",
    composerTitle: isEs ? "Crear proyecto" : "Create project",
    titlePlaceholder: isEs ? "Titulo del proyecto" : "Project title",
    summaryPlaceholder: isEs ? "Resumen en una linea" : "One-line summary",
    stackPlaceholder: isEs ? "Stack (ej. Next.js, Rust, Python, Go)" : "Stack (e.g. Next.js, Rust, Python, Go)",
    repoPlaceholder: isEs ? "URL de repositorio (opcional)" : "Repository URL (optional)",
    demoPlaceholder: isEs ? "URL de demo (opcional)" : "Demo URL (optional)",
    lookingFor: isEs ? "Buscando" : "Looking for",
    publishProject: isEs ? "Publicar proyecto" : "Publish project",
    requiredFields: isEs ? "Titulo, resumen y stack son obligatorios." : "Title, summary and stack are required.",
    supabaseMissing: isEs ? "Supabase no esta configurado." : "Supabase is not configured.",
    signinToPublish: isEs ? "Inicia sesion para publicar en Dev." : "Sign in to publish on Dev.",
    projectPublished: isEs ? "Proyecto publicado." : "Project published.",
    projectUpdated: isEs ? "Proyecto actualizado." : "Project updated.",
    projectDeleted: isEs ? "Proyecto eliminado." : "Project deleted.",
    filtersAria: isEs ? "Filtros" : "Filters",
    searchPlaceholder: isEs ? "Buscar por titulo, stack o colaboracion..." : "Search by title, stack, or collaboration...",
    statusAll: isEs ? "Todo" : "All",
    viewGallery: isEs ? "Galeria" : "Gallery",
    viewGraph: isEs ? "Mapa" : "Graph",
    viewTimeline: isEs ? "Timeline" : "Timeline",
    techMapTitle: isEs ? "Mapa tecnologico" : "Technology map",
    timelineTitle: isEs ? "Linea de progreso" : "Progress timeline",
    noGraphData: isEs ? "Sin data de stack aun." : "No stack data yet.",
    noTimelineData: isEs ? "Sin actividad para timeline." : "No timeline activity yet.",
    createdLabel: isEs ? "Creado" : "Created",
    compareTitle: isEs ? "Comparador rapido" : "Quick compare",
    compareLeft: isEs ? "Proyecto A" : "Project A",
    compareRight: isEs ? "Proyecto B" : "Project B",
    compareNoData: isEs ? "Selecciona dos proyectos para comparar." : "Select two projects to compare.",
    statusIdea: isEs ? "Idea" : "Idea",
    statusBuilding: isEs ? "Construyendo" : "Building",
    statusLive: isEs ? "Publicado" : "Published",
    statusIdeaLower: isEs ? "idea" : "idea",
    statusBuildingLower: isEs ? "construyendo" : "building",
    statusLiveLower: isEs ? "publicado" : "published",
    statusWord: isEs ? "Estado" : "Status",
    noFilterResults: isEs ? "No hay proyectos que coincidan con los filtros actuales." : "No projects match current filters.",
    noProjectsYet: isEs ? "Aun no hay proyectos en este espacio." : "No projects in this space yet.",
    createFirstProject: isEs ? "Crear primer proyecto" : "Create first project",
    view: isEs ? "Ver" : "View",
    copyClone: isEs ? "Copiar git clone" : "Copy git clone",
    repository: isEs ? "Repositorio" : "Repository",
    demo: "Demo",
    edit: isEs ? "Editar" : "Edit",
    remove: isEs ? "Eliminar" : "Delete",
    moveToBuilding: isEs ? "Pasar a construyendo" : "Move to building",
    moveToLive: isEs ? "Publicar ahora" : "Publish now",
    save: isEs ? "Guardar" : "Save",
    cancel: isEs ? "Cancelar" : "Cancel",
    noRepoUrl: isEs ? "No hay URL de repositorio disponible." : "No repository URL available.",
    cloneCopied: isEs ? "Comando de clonado copiado." : "Clone command copied.",
    pendingPreview: isEs ? "Vista pendiente" : "Preview pending",
    pendingHint: isEs ? "Agrega una URL de demo para mostrar instancia en vivo." : "Add a demo URL to show a live instance.",
    previewLabel: isEs ? "Vista previa" : "Preview",
  };

  const statusFilters = useMemo(
    () => [
      { id: "all" as const, label: t.statusAll },
      { id: "idea" as const, label: t.statusIdea },
      { id: "building" as const, label: t.statusBuilding },
      { id: "live" as const, label: t.statusLive },
    ],
    [t.statusAll, t.statusBuilding, t.statusIdea, t.statusLive]
  );

  const collabOptions = useMemo<string[]>(() => (isEs ? [...collabPresets.es] : [...collabPresets.en]), [isEs]);

  const [projects, setProjects] = useState<DevProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<string>(() => readStoredQuery());
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(() => readStoredStatusFilter());
  const [viewMode, setViewMode] = useState<ViewMode>(() => readStoredViewMode());
  const [showComposer, setShowComposer] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, number>>({});

  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStack, setDraftStack] = useState("");
  const [draftRepoUrl, setDraftRepoUrl] = useState("");
  const [draftDemoUrl, setDraftDemoUrl] = useState("");
  const [draftLookingFor, setDraftLookingFor] = useState<string>(collabPresets.es[0]);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editStack, setEditStack] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [editDemoUrl, setEditDemoUrl] = useState("");
  const [editLookingFor, setEditLookingFor] = useState<string>(collabPresets.es[0]);
  const [editStatus, setEditStatus] = useState<DevProject["status"]>("idea");
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("codevamp.dev.viewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("codevamp.dev.statusFilter", activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("codevamp.dev.query", query);
  }, [query]);

  useEffect(() => {
    if (!collabOptions.includes(draftLookingFor)) setDraftLookingFor(collabOptions[0]);
    if (!collabOptions.includes(editLookingFor)) setEditLookingFor(collabOptions[0]);
  }, [collabOptions, draftLookingFor, editLookingFor]);

  useEffect(() => {
    void ensureDevWasmRuntime();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSessionUserId(null);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSessionUserId(data.user?.id ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void ensureExplorerMembership(supabase, sessionUserId, "dev").catch(() => undefined);
  }, [sessionUserId]);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      if (!supabase) {
        if (active) {
          setProjects(initialProjects);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("dev_projects")
        .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
        .order("created_at", { ascending: false })
        .limit(80);

      if (!active) return;

      if (error) {
        setProjects(initialProjects);
        setErrorMsg(formatDevProjectsError(isEs, error));
        setLoading(false);
        return;
      }

      const rows = (data || []) as DevProjectRow[];
      setProjects(rows.map(mapDevProjectRow));
      setLoading(false);
    };

    void loadProjects();
    return () => {
      active = false;
    };
  }, [isEs]);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      if (!supabase || projects.length === 0) {
        if (active) setStatsMap({});
        return;
      }
      const ids = Array.from(new Set(projects.map((project) => project.id).filter(Boolean)));
      if (ids.length === 0) {
        if (active) setStatsMap({});
        return;
      }
      const { data, error } = await supabase
        .from("project_stats")
        .select("project_id, views_count")
        .in("project_id", ids);

      if (!active || error || !data) return;

      const next: Record<string, number> = {};
      for (const row of data as ProjectStatsRow[]) {
        next[row.project_id] = Number(row.views_count ?? 0);
      }
      setStatsMap(next);
    };

    void loadStats();
    return () => {
      active = false;
    };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (activeStatus !== "all" && project.status !== activeStatus) return false;
      if (!q) return true;
      return `${project.title} ${project.summary} ${project.stack} ${project.lookingFor}`.toLowerCase().includes(q);
    });
  }, [projects, activeStatus, query]);

  const metrics = useMemo(() => {
    const published = projects.filter((project) => project.status === "live").length;
    const building = projects.filter((project) => project.status === "building").length;
    const ideas = projects.filter((project) => project.status === "idea").length;
    return { published, building, ideas };
  }, [projects]);

  const techNodes = useMemo(() => buildTechNodes(filtered), [filtered]);

  const timelineProjects = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filtered]
  );

  const compareLeft = useMemo(
    () => filtered.find((item) => item.id === compareLeftId) ?? null,
    [compareLeftId, filtered]
  );
  const compareRight = useMemo(
    () => filtered.find((item) => item.id === compareRightId) ?? null,
    [compareRightId, filtered]
  );

  const authHref = "/auth?returnTo=/dev";
  const sessionReady = typeof sessionUserId === "string" && sessionUserId.length > 0;

  const resetMessages = () => {
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const publishProject = async () => {
    resetMessages();

    const title = draftTitle.trim();
    const summary = draftSummary.trim();
    const stack = draftStack.trim();
    if (!title || !summary || !stack) {
      setErrorMsg(t.requiredFields);
      return;
    }

    if (!supabase) {
      setErrorMsg(t.supabaseMissing);
      return;
    }

    if (!sessionUserId) {
      setErrorMsg(t.signinToPublish);
      return;
    }

    const payload = {
      title,
      summary,
      stack,
      repo_url: normalizeUrl(draftRepoUrl),
      demo_url: normalizeUrl(draftDemoUrl),
      looking_for: draftLookingFor,
      status: "idea" as const,
      author_handle: "@dev",
      created_by: sessionUserId,
    };

    const { data, error } = await supabase
      .from("dev_projects")
      .insert(payload)
      .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
      .single();

    if (error || !data) {
      setErrorMsg(formatDevProjectsError(isEs, error));
      return;
    }

    const nextProject = mapDevProjectRow(data as DevProjectRow);
    setProjects((prev) => [nextProject, ...prev]);
    setDraftTitle("");
    setDraftSummary("");
    setDraftStack("");
    setDraftRepoUrl("");
    setDraftDemoUrl("");
    setDraftLookingFor(collabOptions[0]);
    setShowComposer(false);
    setInfoMsg(t.projectPublished);
  };

  const updateProjectStatus = async (project: DevProject, nextStatus: DevProject["status"]) => {
    resetMessages();

    if (project.status === nextStatus) return;
    if (nextStatus === "live") {
      const quality = qualityScore(project, isEs);
      const engine = scoreProjectLocal({
        title: project.title,
        summary: project.summary,
        stack: project.stack,
        hasRepo: Boolean(project.repoUrl),
        hasDemo: Boolean(project.demoUrl),
      });
      const views = statsMap[project.id] ?? 0;
      const gate = buildReleaseGate(isEs, project, quality, engine, views);
      if (!gate.canPublish) {
        setErrorMsg(`${t.publishBlocked} ${gate.reasons.join(" · ")}`);
        return;
      }
    }

    if (!supabase) {
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? { ...item, status: nextStatus } : item))
      );
      setInfoMsg(t.projectUpdated);
      return;
    }

    const { data, error } = await supabase
      .from("dev_projects")
      .update({ status: nextStatus })
      .eq("id", project.id)
      .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
      .single();

    if (error || !data) {
      setErrorMsg(formatDevProjectsError(isEs, error));
      return;
    }

    const updated = mapDevProjectRow(data as DevProjectRow);
    setProjects((prev) => prev.map((item) => (item.id === project.id ? updated : item)));
    setInfoMsg(t.projectUpdated);
  };

  const startEdit = (project: DevProject) => {
    resetMessages();
    setEditingProjectId(project.id);
    setEditTitle(project.title);
    setEditSummary(project.summary);
    setEditStack(project.stack);
    setEditRepoUrl(project.repoUrl);
    setEditDemoUrl(project.demoUrl);
    setEditLookingFor(project.lookingFor);
    setEditStatus(project.status);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
  };

  const saveEdit = async () => {
    if (!editingProjectId) return;
    resetMessages();

    const title = editTitle.trim();
    const summary = editSummary.trim();
    const stack = editStack.trim();
    if (!title || !summary || !stack) {
      setErrorMsg(t.requiredFields);
      return;
    }

    if (!supabase) {
      setErrorMsg(t.supabaseMissing);
      return;
    }

    const payload = {
      title,
      summary,
      stack,
      repo_url: normalizeUrl(editRepoUrl),
      demo_url: normalizeUrl(editDemoUrl),
      looking_for: editLookingFor,
      status: editStatus,
    };

    const { data, error } = await supabase
      .from("dev_projects")
      .update(payload)
      .eq("id", editingProjectId)
      .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
      .single();

    if (error || !data) {
      setErrorMsg(formatDevProjectsError(isEs, error));
      return;
    }

    const updated = mapDevProjectRow(data as DevProjectRow);
    setProjects((prev) => prev.map((project) => (project.id === editingProjectId ? updated : project)));
    setEditingProjectId(null);
    setInfoMsg(t.projectUpdated);
  };

  const deleteProject = async (projectId: string) => {
    resetMessages();

    if (!supabase) {
      setErrorMsg(t.supabaseMissing);
      return;
    }

    const { error } = await supabase.from("dev_projects").delete().eq("id", projectId);
    if (error) {
      setErrorMsg(formatDevProjectsError(isEs, error));
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setInfoMsg(t.projectDeleted);
  };

  const copyClone = async (repoUrl: string) => {
    const normalized = normalizeUrl(repoUrl);
    if (!normalized) {
      setErrorMsg(t.noRepoUrl);
      return;
    }
    try {
      await navigator.clipboard.writeText(`git clone ${normalized}`);
      setInfoMsg(t.cloneCopied);
    } catch {
      setErrorMsg(isEs ? "No se pudo copiar al portapapeles." : "Unable to copy to clipboard.");
    }
  };

  return (
    <main className="dev-root dev-root--stable" data-brand="dev">
      <div className="dev-shell">
        <header className="dev-topbar">
          <Link href="/dev" className="dev-brand" prefetch>
            <span className="dev-brand__badge">DV</span>
            <span className="dev-brand__text">
              <strong>{t.devBrandTitle}</strong>
              <span>{t.brandSubtitle}</span>
            </span>
          </Link>
          <nav className="dev-nav">
            <Link href="/dev" className="is-active" aria-current="page" prefetch>
              {t.inDev}
            </Link>
            <Link href="/proyectos" prefetch>
              {t.published}
            </Link>
          </nav>
          <button
            type="button"
            className="dev-topbar__cta"
            onClick={() => setUiLanguage(language === "es" ? "en" : "es")}
          >
            {t.language}
          </button>
          {sessionReady ? (
            <button
              type="button"
              className="dev-topbar__cta dev-topbar__cta--ghost"
              onClick={() => void supabase?.auth.signOut()}
            >
              {t.signOut}
            </button>
          ) : (
            <Link href={authHref} className="dev-topbar__cta dev-topbar__cta--ghost" prefetch>
              {t.signIn}
            </Link>
          )}
        </header>

        <BannerLab isEs={isEs} metrics={metrics} kicker={t.heroKicker} initialTitle={t.heroTitle} initialSubtitle={t.heroCopy}>
          <div className="dev-hero__actions">
            <button type="button" className="dev-action-primary" onClick={() => setShowComposer(true)}>
              {t.toggleComposer}
            </button>
            <Link href="/dev/studio" className="dev-action-secondary" prefetch>
              {t.flowBuildAction}
            </Link>
            <button type="button" className="dev-action-secondary" onClick={() => setActiveStatus("live")}>
              {t.flowMeasureAction}
            </button>
          </div>
        </BannerLab>
        {showComposer ? (
          <section
            className="dev-composer-shell is-open"
            aria-label={t.composerTitle}
            onClick={() => setShowComposer(false)}
          >
            <div className="dev-composer-shell__inner" onClick={(event) => event.stopPropagation()}>
              <section className="dev-composer">
                <div className="dev-composer__header">
                  <h2 className="dev-section-title">{t.composerTitle}</h2>
                  <button type="button" className="dev-action-secondary" onClick={() => setShowComposer(false)}>
                    {t.cancel}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={t.titlePlaceholder}
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
                <input
                  type="text"
                  placeholder={t.summaryPlaceholder}
                  value={draftSummary}
                  onChange={(event) => setDraftSummary(event.target.value)}
                />
                <input
                  type="text"
                  placeholder={t.stackPlaceholder}
                  value={draftStack}
                  onChange={(event) => setDraftStack(event.target.value)}
                />
                <div className="dev-composer__row">
                  <input
                    type="url"
                    placeholder={t.repoPlaceholder}
                    value={draftRepoUrl}
                    onChange={(event) => setDraftRepoUrl(event.target.value)}
                  />
                  <input
                    type="url"
                    placeholder={t.demoPlaceholder}
                    value={draftDemoUrl}
                    onChange={(event) => setDraftDemoUrl(event.target.value)}
                  />
                </div>
                <div className="dev-composer__row">
                  <select value={draftLookingFor} onChange={(event) => setDraftLookingFor(event.target.value)}>
                    {collabOptions.map((option) => (
                      <option key={option} value={option}>
                        {t.lookingFor}: {option}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => void publishProject()}>
                    {t.publishProject}
                  </button>
                </div>
              </section>
            </div>
          </section>
        ) : null}

        {errorMsg ? <p className="dev-msg dev-msg--error">{errorMsg}</p> : null}
        {infoMsg ? <p className="dev-msg dev-msg--info">{infoMsg}</p> : null}

        <section className="dev-filters" aria-label={t.filtersAria}>
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="dev-chips">
            {statusFilters.map((status) => (
              <button
                key={status.id}
                type="button"
                className={activeStatus === status.id ? "is-active" : ""}
                onClick={() => setActiveStatus(status.id)}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="dev-chips dev-chips--view">
            <button
              type="button"
              className={viewMode === "gallery" ? "is-active" : ""}
              onClick={() => setViewMode("gallery")}
            >
              {t.viewGallery}
            </button>
            <button
              type="button"
              className={viewMode === "graph" ? "is-active" : ""}
              onClick={() => setViewMode("graph")}
            >
              {t.viewGraph}
            </button>
            <button
              type="button"
              className={viewMode === "timeline" ? "is-active" : ""}
              onClick={() => setViewMode("timeline")}
            >
              {t.viewTimeline}
            </button>
          </div>
        </section>

        <section className="dev-compare" aria-label={t.compareTitle}>
          <h2 className="dev-section-title">{t.compareTitle}</h2>
          <div className="dev-compare__controls">
            <label>
              {t.compareLeft}
              <select value={compareLeftId} onChange={(event) => setCompareLeftId(event.target.value)}>
                <option value="">-</option>
                {filtered.map((item) => (
                  <option key={`left-${item.id}`} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.compareRight}
              <select value={compareRightId} onChange={(event) => setCompareRightId(event.target.value)}>
                <option value="">-</option>
                {filtered.map((item) => (
                  <option key={`right-${item.id}`} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {compareLeft && compareRight ? (
            <div className="dev-compare__result">
              <article>
                <strong>{compareLeft.title}</strong>
                <span>{t.metricsQuality}: {qualityScore(compareLeft, isEs)}%</span>
                <span>{t.metricsEngine}: {scoreProjectLocal({
                  title: compareLeft.title,
                  summary: compareLeft.summary,
                  stack: compareLeft.stack,
                  hasRepo: Boolean(compareLeft.repoUrl),
                  hasDemo: Boolean(compareLeft.demoUrl),
                })}%</span>
              </article>
              <article>
                <strong>{compareRight.title}</strong>
                <span>{t.metricsQuality}: {qualityScore(compareRight, isEs)}%</span>
                <span>{t.metricsEngine}: {scoreProjectLocal({
                  title: compareRight.title,
                  summary: compareRight.summary,
                  stack: compareRight.stack,
                  hasRepo: Boolean(compareRight.repoUrl),
                  hasDemo: Boolean(compareRight.demoUrl),
                })}%</span>
              </article>
            </div>
          ) : (
            <p className="dev-empty">{t.compareNoData}</p>
          )}
        </section>

        {viewMode === "gallery" ? (
          <section id="dev-feed" className="dev-feed" aria-label="Dev projects feed">
          {loading
            ? skeletonCards.map((cardId) => (
                <article key={cardId} className="dev-card dev-card--skeleton" aria-hidden>
                  <div className="dev-line dev-line--title" />
                  <div className="dev-line dev-line--body" />
                  <div className="dev-line dev-line--body-short" />
                  <div className="dev-row">
                    <span className="dev-pill" />
                    <span className="dev-pill" />
                    <span className="dev-pill" />
                  </div>
                </article>
              ))
            : null}

          {filtered.map((project) => {
            const showEmbeddedPreview = canEmbedDemo(project.demoUrl);
            const compact = !showEmbeddedPreview;
            const checks = buildQualityChecks(project, isEs);
            const score = qualityScore(project, isEs);
            const engineScore = scoreProjectLocal({
              title: project.title,
              summary: project.summary,
              stack: project.stack,
              hasRepo: Boolean(project.repoUrl),
              hasDemo: Boolean(project.demoUrl),
            });
            const views = statsMap[project.id] ?? 0;
            const releaseGate = buildReleaseGate(isEs, project, score, engineScore, views);
            const cycleDays =
              project.status === "live"
                ? Math.max(1, Math.ceil((Date.now() - new Date(project.createdAt).getTime()) / 86400000))
                : null;

            return (
              <article
                key={project.id}
                className={`dev-card${compact ? " dev-card--compact" : ""}${publishedId === project.id ? " dev-card--published" : ""}`}
              >
                {editingProjectId === project.id ? (
                  <div className="dev-edit">
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                    <input value={editSummary} onChange={(event) => setEditSummary(event.target.value)} />
                    <input value={editStack} onChange={(event) => setEditStack(event.target.value)} />
                    <div className="dev-composer__row">
                      <input value={editRepoUrl} onChange={(event) => setEditRepoUrl(event.target.value)} />
                      <input value={editDemoUrl} onChange={(event) => setEditDemoUrl(event.target.value)} />
                    </div>
                    <div className="dev-composer__row">
                      <select value={editLookingFor} onChange={(event) => setEditLookingFor(event.target.value)}>
                        {collabOptions.map((option) => (
                          <option key={option} value={option}>
                            {t.lookingFor}: {option}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editStatus}
                        onChange={(event) => setEditStatus(event.target.value as DevProject["status"])}
                      >
                        <option value="idea">{t.statusWord}: {t.statusIdeaLower}</option>
                        <option value="building">{t.statusWord}: {t.statusBuildingLower}</option>
                        <option value="live">{t.statusWord}: {t.statusLiveLower}</option>
                      </select>
                    </div>
                    <div className="dev-card__actions">
                      <button type="button" onClick={() => void saveEdit()}>{t.save}</button>
                      <button type="button" onClick={cancelEdit}>{t.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`dev-card__preview${compact ? " dev-card__preview--compact" : ""}`} aria-label={`${t.previewLabel} ${project.title}`}>
                      {showEmbeddedPreview ? (
                        <iframe
                          src={project.demoUrl}
                          title={`${t.previewLabel} ${project.title}`}
                          loading="lazy"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <div className="dev-card__preview-empty">
                          <span>{t.pendingPreview}</span>
                          <p>{t.pendingHint}</p>
                        </div>
                      )}
                    </div>
                    <div className="dev-card__head">
                      <h2>
                        <Link href={`/dev/proyecto/${project.id}`} prefetch>
                          {project.title}
                        </Link>
                      </h2>
                      <span className={`dev-status dev-status--${project.status}`}>{statusLabel(project.status, t)}</span>
                    </div>
                    <p>{project.summary}</p>
                    <div className="dev-card__meta">
                      <span>{project.stack}</span>
                      <span>{project.lookingFor}</span>
                      <span>{project.author}</span>
                      <span>{project.updated}</span>
                    </div>
                    <div className="dev-card__insights">
                      <span>{t.metricsViews}: {formatCompactMetric(views)}</span>
                      <span>{t.metricsQuality}: {score}%</span>
                      <span>{t.metricsEngine}: {engineScore}%</span>
                      <span>
                        {t.metricsCycle}: {cycleDays ? `${cycleDays} ${t.daysLabel}` : "-"}
                      </span>
                    </div>
                    <div className="dev-card__quality" aria-label={t.qualityChecklist}>
                      {checks.map((check) => (
                        <span key={check.id} className={check.done ? "is-pass" : "is-fail"}>
                          {check.done ? "OK" : "TODO"} - {check.label}
                        </span>
                      ))}
                    </div>
                    <div className="dev-card__release" aria-label={t.releaseGateTitle}>
                      <strong>{t.releaseGateTitle}</strong>
                      {releaseGate.canPublish ? (
                        <span className="is-pass">{t.releaseGatePass}</span>
                      ) : (
                        <span className="is-fail">{releaseGate.reasons.join(" · ")}</span>
                      )}
                    </div>
                    <div className="dev-card__actions">
                      <Link href={`/dev/proyecto/${project.id}`} prefetch>{t.view}</Link>
                      <button type="button" onClick={() => void copyClone(project.repoUrl)}>{t.copyClone}</button>
                      {project.repoUrl ? (
                        <a href={project.repoUrl} target="_blank" rel="noreferrer">{t.repository}</a>
                      ) : null}
                      {project.demoUrl ? (
                        <a href={project.demoUrl} target="_blank" rel="noreferrer">{t.demo}</a>
                      ) : null}
                      {sessionUserId && project.ownerId === sessionUserId ? (
                        <>
                          {project.status === "idea" ? (
                            <button type="button" onClick={() => void updateProjectStatus(project, "building")}>
                              {t.moveToBuilding}
                            </button>
                          ) : null}
                          {project.status === "building" ? (
                            <button
                              type="button"
                              onClick={() => void updateProjectStatus(project, "live")}
                              disabled={!releaseGate.canPublish}
                              title={!releaseGate.canPublish ? `${t.publishBlocked} ${releaseGate.reasons.join(" · ")}` : undefined}
                            >
                              {t.moveToLive}
                            </button>
                          ) : null}
                          <button type="button" onClick={() => startEdit(project)}>{t.edit}</button>
                          <button type="button" onClick={() => void deleteProject(project.id)}>{t.remove}</button>
                        </>
                      ) : null}
                    </div>
                  </>
                )}
              </article>
            );
          })}

          {!loading && filtered.length === 0 ? (
            <div className="dev-empty dev-empty--action">
              <p>{projects.length === 0 ? t.noProjectsYet : t.noFilterResults}</p>
              <button type="button" className="dev-action-secondary" onClick={() => setShowComposer(true)}>
                {t.createFirstProject}
              </button>
            </div>
          ) : null}
          </section>
        ) : null}

        {viewMode === "graph" ? (
          <section className="dev-graph" aria-label={t.techMapTitle}>
            <h2 className="dev-section-title">{t.techMapTitle}</h2>
            {techNodes.length === 0 ? (
              <p className="dev-empty">{t.noGraphData}</p>
            ) : (
              <div className="dev-graph__nodes">
                {techNodes.map((node) => (
                  <article key={node.id} className="dev-graph__node">
                    <strong>{node.label}</strong>
                    <span>{node.count}x</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {viewMode === "timeline" ? (
          <section className="dev-timeline" aria-label={t.timelineTitle}>
            <h2 className="dev-section-title">{t.timelineTitle}</h2>
            {timelineProjects.length === 0 ? (
              <p className="dev-empty">{t.noTimelineData}</p>
            ) : (
              <div className="dev-timeline__list">
                {timelineProjects.map((project) => (
                  <article key={project.id} className="dev-timeline__item">
                    <header>
                      <strong>{project.title}</strong>
                      <span className={`dev-status dev-status--${project.status}`}>
                        {statusLabel(project.status, t)}
                      </span>
                    </header>
                    <p>{project.summary}</p>
                    <div className="dev-card__meta">
                      <span>{t.createdLabel}: {new Date(project.createdAt).toLocaleDateString()}</span>
                      <span>{project.stack}</span>
                      <span>{project.author}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
