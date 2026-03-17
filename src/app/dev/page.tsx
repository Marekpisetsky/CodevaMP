"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import BannerLab from "@/app/dev/banner-lab";
import { ensureDevWasmRuntime } from "@/app/lib/dev-wasm-loader";
import {
  mergeDevProjectCatalogs,
  mapDevProjectRow,
  normalizeDevProject,
  readLocalDevProjects,
  upsertLocalDevProject,
  type DevProject,
  type DevProjectRow,
  writeLocalDevProjects,
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

const collabPresets = {
  es: ["Idea", "Construir", "Publicar"],
  en: ["Idea", "Build", "Publish"],
} as const;

function phaseToStatus(phase: string): DevProject["status"] {
  if (phase === "Construir" || phase === "Build") return "building";
  if (phase === "Publicar" || phase === "Publish") return "live";
  return "idea";
}

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
  const fromIdeaId = (searchParams.get("fromIdea") || "").trim();
  const requestedFlow = (searchParams.get("flow") || "").trim().toLowerCase();

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
    toggleComposer: isEs ? "1. Idea" : "1. Idea",
    flowBuildAction: isEs ? "2. Construir en Studio" : "2. Build in Studio",
    flowMeasureAction: isEs ? "3. Medir publicados" : "3. Measure published",
    strategyLink: isEs ? "Ver estrategia" : "View strategy",
    metricsPublished: isEs ? "Publicados" : "Published",
    metricsBuilding: isEs ? "Construyendo" : "Building",
    metricsIdeas: isEs ? "Ideas" : "Ideas",
    metricsViews: isEs ? "Vistas" : "Views",
    composerTitle: isEs ? "Crear proyecto" : "Create project",
    composerIntro: isEs ? "Define la base del proyecto y deja claros los enlaces antes de publicarlo." : "Define the base of the project and make the links clear before publishing it.",
    composerBasics: isEs ? "Base del proyecto" : "Project base",
    composerLinks: isEs ? "Enlaces y salida" : "Links and output",
    composerMode: isEs ? "Flujo" : "Flow",
    composerIdeaHint: isEs ? "Solo define la idea con claridad. Aun no hace falta stack ni enlaces." : "Just define the idea clearly. No stack or links are needed yet.",
    composerBuildHint: isEs ? "Aqui la idea ya esta definida y pasa a ejecucion. Deja claro lo que el desarrollador debe construir." : "At this stage the idea is already defined and moves into execution. Make clear what the developer must build.",
    composerPublishHint: isEs ? "Usa esta fase cuando ya tengas salida visible y enlaces reales." : "Use this phase when you already have visible output and real links.",
    composerGuideTitle: isEs ? "Que conviene dejar claro" : "What should be clear now",
    composerIdeaGuideA: isEs ? "Que problema quieres resolver o explorar." : "What problem you want to solve or explore.",
    composerIdeaGuideB: isEs ? "Para quien seria util o interesante." : "Who it would be useful or interesting for.",
    composerIdeaGuideC: isEs ? "Que hace especial esta idea frente a otras." : "What makes this idea special compared to others.",
    composerBuildGuideA: isEs ? "Que debe construirse exactamente en esta iteracion." : "What exactly must be built in this iteration.",
    composerBuildGuideB: isEs ? "Que stack, servicios o piezas tecnicas necesita." : "Which stack, services, or technical pieces it needs.",
    composerBuildGuideC: isEs ? "Que repositorio o fuente tomara el desarrollador como base." : "Which repository or source the developer will take as the base.",
    linkedIdeaLabel: isEs ? "Idea vinculada" : "Linked idea",
    linkedIdeaPlaceholder: isEs ? "Sin idea vinculada" : "No linked idea",
    linkedIdeaHint: isEs ? "Puedes vincular una idea ya definida para convertirla en brief de desarrollo, o construir sin idea previa." : "You can link an already defined idea to turn it into a development brief, or build without a prior idea.",
    composerPublishGuideA: isEs ? "Que puede usar otra persona hoy mismo." : "What another person can use right now.",
    composerPublishGuideB: isEs ? "Donde se prueba o se ve en funcionamiento." : "Where it can be tested or seen working.",
    composerPublishGuideC: isEs ? "Que estado de madurez tiene esta version." : "What maturity level this version has.",
    summaryIdeaPlaceholder: isEs ? "Problema, usuario y valor de la idea." : "Problem, user, and value of the idea.",
    summaryBuildPlaceholder: isEs ? "Brief tecnico: alcance, prioridad y siguiente entregable." : "Technical brief: scope, priority, and next deliverable.",
    summaryPublishPlaceholder: isEs ? "Que hace esta version y por que alguien deberia usarla hoy." : "What this version does and why someone should use it today.",
    stackBuildPlaceholder: isEs ? "Stack, servicios y piezas que desarrollo usara." : "Stack, services, and pieces development will use.",
    stackPublishPlaceholder: isEs ? "Stack final de esta version publica." : "Final stack for this public version.",
    titlePlaceholder: isEs ? "Titulo del proyecto" : "Project title",
    summaryPlaceholder: isEs ? "Resumen en una linea" : "One-line summary",
    stackPlaceholder: isEs ? "Stack (ej. Next.js, Rust, Python, Go)" : "Stack (e.g. Next.js, Rust, Python, Go)",
    repoPlaceholder: isEs ? "URL de repositorio (opcional)" : "Repository URL (optional)",
    demoPlaceholder: isEs ? "URL de demo (opcional)" : "Demo URL (optional)",
    lookingFor: isEs ? "Buscando" : "Looking for",
    publishProject: isEs ? "Publicar proyecto" : "Publish project",
    saveIdea: isEs ? "Guardar idea" : "Save idea",
    saveBuild: isEs ? "Guardar build" : "Save build",
    publishRelease: isEs ? "Lanzar version publica" : "Launch public release",
    requiredFields: isEs ? "Titulo y resumen son obligatorios." : "Title and summary are required.",
    supabaseMissing: isEs ? "Supabase no esta configurado." : "Supabase is not configured.",
    signinToPublish: isEs ? "Inicia sesion para publicar en Dev." : "Sign in to publish on Dev.",
    projectPublished: isEs ? "Version publica lanzada." : "Public release launched.",
    ideaSaved: isEs ? "Idea guardada." : "Idea saved.",
    buildSaved: isEs ? "Brief de desarrollo guardado." : "Development brief saved.",
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
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
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
  const [draftLinkedIdeaIds, setDraftLinkedIdeaIds] = useState<string[]>([]);
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");
  const [appliedComposerPreset, setAppliedComposerPreset] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedView = window.localStorage.getItem("codevamp.dev.viewMode");
    const savedStatus = window.localStorage.getItem("codevamp.dev.statusFilter");
    const savedQuery = window.localStorage.getItem("codevamp.dev.query");

    if (savedView === "gallery" || savedView === "graph" || savedView === "timeline") {
      setViewMode(savedView);
    }
    if (savedStatus === "all" || savedStatus === "idea" || savedStatus === "building" || savedStatus === "live") {
      setActiveStatus(savedStatus);
    }
    if (typeof savedQuery === "string" && savedQuery.length > 0) {
      setQuery(savedQuery);
    }
  }, []);

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
  }, [collabOptions, draftLookingFor]);

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
      const localProjects = readLocalDevProjects();
      if (!supabase) {
        if (active) {
          setProjects(localProjects);
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
        setProjects(localProjects);
        setErrorMsg(formatDevProjectsError(isEs, error));
        setLoading(false);
        return;
      }

      const rows = (data || []) as DevProjectRow[];
      setProjects(mergeDevProjectCatalogs(rows.map(mapDevProjectRow), localProjects));
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

  const projectIds = useMemo(() => projects.map((project) => project.id).filter(Boolean), [projects]);
  const projectIdsSignature = useMemo(() => projectIds.join("|"), [projectIds]);

  useEffect(() => {
    let active = true;
    const loadLinkedIdeas = async () => {
      if (!supabase || projectIds.length === 0) {
        return;
      }
      const ids = Array.from(new Set(projectIds));
      if (ids.length === 0) {
        return;
      }
      const { data, error } = await supabase
        .from("dev_project_idea_links")
        .select("project_id, idea_id")
        .in("project_id", ids);

      if (!active) return;
      if (error || !data) {
        return;
      }

      const next: Record<string, string[]> = {};
      for (const row of data as Array<{ project_id: string; idea_id: string }>) {
        if (!next[row.project_id]) next[row.project_id] = [];
        next[row.project_id].push(row.idea_id);
      }
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          linkedIdeaIds: next[project.id] ?? [],
        }))
      );
    };

    void loadLinkedIdeas();
    return () => {
      active = false;
    };
  }, [projectIds, projectIdsSignature]);

  const linkedIdeaSearchMap = useMemo(
    () =>
      new Map(
        projects
          .filter((project) => project.status === "idea")
          .map((project) => [project.id, `${project.title} ${project.summary}`.trim()])
      ),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (activeStatus !== "all" && project.status !== activeStatus) return false;
      if (!q) return true;
      const linkedIdeaMetadata = project.linkedIdeaIds
        .map((ideaId) => linkedIdeaSearchMap.get(ideaId) ?? "")
        .join(" ");
      return `${project.title} ${project.summary} ${project.stack} ${project.lookingFor} ${linkedIdeaMetadata}`
        .toLowerCase()
        .includes(q);
    });
  }, [projects, activeStatus, query, linkedIdeaSearchMap]);

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
  const ideaProjects = useMemo(
    () => projects.filter((project) => project.status === "idea"),
    [projects]
  );
  const buildPhaseLabel = isEs ? collabPresets.es[1] : collabPresets.en[1];
  const draftPhaseStatus = phaseToStatus(draftLookingFor);
  const draftNeedsStack = draftPhaseStatus !== "idea";
  const draftShowsRepo = draftPhaseStatus !== "idea";
  const draftShowsDemo = draftPhaseStatus === "live";
  const draftPhaseHint =
    draftPhaseStatus === "idea"
      ? t.composerIdeaHint
      : draftPhaseStatus === "building"
        ? t.composerBuildHint
        : t.composerPublishHint;
  const draftActionLabel =
    draftPhaseStatus === "idea"
      ? t.saveIdea
      : draftPhaseStatus === "building"
        ? t.saveBuild
        : t.publishRelease;
  const draftSuccessLabel =
    draftPhaseStatus === "idea"
      ? t.ideaSaved
      : draftPhaseStatus === "building"
        ? t.buildSaved
        : t.projectPublished;
  const draftGuideItems =
    draftPhaseStatus === "idea"
      ? [t.composerIdeaGuideA, t.composerIdeaGuideB, t.composerIdeaGuideC]
      : draftPhaseStatus === "building"
        ? [t.composerBuildGuideA, t.composerBuildGuideB, t.composerBuildGuideC]
        : [t.composerPublishGuideA, t.composerPublishGuideB, t.composerPublishGuideC];
  const draftSummaryPlaceholder =
    draftPhaseStatus === "idea"
      ? t.summaryIdeaPlaceholder
      : draftPhaseStatus === "building"
        ? t.summaryBuildPlaceholder
        : t.summaryPublishPlaceholder;
  const draftStackPlaceholder = draftPhaseStatus === "live" ? t.stackPublishPlaceholder : t.stackBuildPlaceholder;

  const authHref = "/auth?returnTo=/dev";
  const sessionReady = typeof sessionUserId === "string" && sessionUserId.length > 0;

  useEffect(() => {
    const presetKey = `${fromIdeaId}:${requestedFlow}`;
    if (!fromIdeaId || requestedFlow !== "build" || appliedComposerPreset === presetKey) {
      return;
    }
    const sourceIdea = projects.find((project) => project.id === fromIdeaId && project.status === "idea");
    if (!sourceIdea) {
      return;
    }

    setDraftLookingFor(buildPhaseLabel);
    setDraftLinkedIdeaIds([sourceIdea.id]);
    setDraftStack((current) => current || sourceIdea.stack);
    setShowComposer(true);
    setAppliedComposerPreset(presetKey);
  }, [fromIdeaId, requestedFlow, appliedComposerPreset, projects, buildPhaseLabel]);

  const resetMessages = () => {
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const syncLinkedIdeas = async (projectId: string, ideaIds: string[]) => {
    const uniqueIds = Array.from(new Set(ideaIds.filter(Boolean)));
    if (!supabase) {
      setProjects((prev) => {
        const next = prev.map((project) => (project.id === projectId ? { ...project, linkedIdeaIds: uniqueIds } : project));
        writeLocalDevProjects(next);
        return next;
      });
      return;
    }

    const { error: deleteError } = await supabase
      .from("dev_project_idea_links")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      return;
    }

    if (uniqueIds.length > 0) {
      const { error: insertError } = await supabase.from("dev_project_idea_links").insert(
        uniqueIds.map((ideaId) => ({
          project_id: projectId,
          idea_id: ideaId,
        }))
      );
      if (insertError) {
        return;
      }
    }

    setProjects((prev) =>
      prev.map((project) => (project.id === projectId ? { ...project, linkedIdeaIds: uniqueIds } : project))
    );
  };

  const publishProject = async () => {
    resetMessages();

    const title = draftTitle.trim();
    const summary = draftSummary.trim();
    const stack = draftStack.trim();
    const demoUrl = normalizeUrl(draftDemoUrl);
    const repoUrl = normalizeUrl(draftRepoUrl);
    if (!title || !summary) {
      setErrorMsg(t.requiredFields);
      return;
    }

    const localProject: DevProject = normalizeDevProject({
      id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      summary,
      stack,
      repoUrl,
      demoUrl,
      lookingFor: draftLookingFor,
      linkedIdeaIds: draftPhaseStatus === "building" ? draftLinkedIdeaIds : [],
      status: draftPhaseStatus,
      author: "",
      updated: "",
      createdAt: new Date().toISOString(),
      ownerId: sessionUserId ?? "local",
    });

    if (!supabase || !sessionUserId) {
      const next = upsertLocalDevProject(localProject);
      setProjects((prev) => mergeDevProjectCatalogs(prev, next));
      setInfoMsg(draftSuccessLabel);
      setDraftTitle("");
      setDraftSummary("");
      setDraftStack("");
      setDraftRepoUrl("");
      setDraftDemoUrl("");
      setDraftLookingFor(collabOptions[0]);
      setDraftLinkedIdeaIds([]);
      setShowComposer(false);
      return;
    }

    const payload = {
      title,
      summary,
      stack,
      repo_url: repoUrl,
      demo_url: demoUrl,
      looking_for: draftLookingFor,
      status: draftPhaseStatus,
      created_by: sessionUserId,
    };

    const { data, error } = await supabase
      .from("dev_projects")
      .insert(payload)
      .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
      .single();

    if (error || !data) {
      const next = upsertLocalDevProject(localProject);
      setProjects((prev) => mergeDevProjectCatalogs(prev, next));
      setInfoMsg(draftSuccessLabel);
      setErrorMsg(formatDevProjectsError(isEs, error));
      setDraftTitle("");
      setDraftSummary("");
      setDraftStack("");
      setDraftRepoUrl("");
      setDraftDemoUrl("");
      setDraftLookingFor(collabOptions[0]);
      setDraftLinkedIdeaIds([]);
      setShowComposer(false);
      return;
    }

    const nextProject = mapDevProjectRow(data as DevProjectRow);
    await syncLinkedIdeas(nextProject.id, draftPhaseStatus === "building" ? draftLinkedIdeaIds : []);
    setProjects((prev) => [{ ...nextProject, linkedIdeaIds: draftPhaseStatus === "building" ? draftLinkedIdeaIds : [] }, ...prev.filter((item) => item.id !== nextProject.id)]);
    setDraftTitle("");
    setDraftSummary("");
    setDraftStack("");
    setDraftRepoUrl("");
    setDraftDemoUrl("");
    setDraftLookingFor(collabOptions[0]);
    setDraftLinkedIdeaIds([]);
    setShowComposer(false);
    setInfoMsg(draftSuccessLabel);
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
                  <div className="dev-composer__titleblock">
                    <h2 className="dev-section-title">{t.composerTitle}</h2>
                    <p>{t.composerIntro}</p>
                  </div>
                  <button type="button" className="dev-action-secondary" onClick={() => setShowComposer(false)}>
                    {t.cancel}
                  </button>
                </div>
                <div className="dev-composer__group">
                  <p className="dev-composer__eyebrow">{t.composerMode}</p>
                  <div className="dev-chips dev-chips--composer">
                    {collabOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={draftLookingFor === option ? "is-active" : ""}
                        onClick={() => setDraftLookingFor(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="dev-composer__hint">{draftPhaseHint}</p>
                  <div className="dev-composer__guide">
                    <strong>{t.composerGuideTitle}</strong>
                    <ul>
                      {draftGuideItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {draftPhaseStatus === "building" ? (
                    <label className="dev-composer__field">
                      <span>{t.linkedIdeaLabel}</span>
                      <div className="dev-idea-links">
                        <label className="dev-idea-links__option">
                          <input
                            type="checkbox"
                            checked={draftLinkedIdeaIds.length === 0}
                            onChange={() => setDraftLinkedIdeaIds([])}
                          />
                          <span>{t.linkedIdeaPlaceholder}</span>
                        </label>
                        {ideaProjects.map((project) => (
                          <label key={project.id} className="dev-idea-links__option">
                            <input
                              type="checkbox"
                              checked={draftLinkedIdeaIds.includes(project.id)}
                              onChange={(event) =>
                                setDraftLinkedIdeaIds((prev) =>
                                  event.target.checked ? [...prev, project.id] : prev.filter((id) => id !== project.id)
                                )
                              }
                            />
                            <span>{project.title}</span>
                          </label>
                        ))}
                      </div>
                      <small className="dev-composer__field-hint">{t.linkedIdeaHint}</small>
                    </label>
                  ) : null}
                </div>
                <div className="dev-composer__group">
                  <p className="dev-composer__eyebrow">{t.composerBasics}</p>
                  <div className="dev-composer__stack">
                    <label className="dev-composer__field">
                      <span>{t.titlePlaceholder}</span>
                      <input
                        type="text"
                        placeholder={t.titlePlaceholder}
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                      />
                    </label>
                    <label className="dev-composer__field">
                      <span>{t.summaryPlaceholder}</span>
                      <input
                        type="text"
                        placeholder={draftSummaryPlaceholder}
                        value={draftSummary}
                        onChange={(event) => setDraftSummary(event.target.value)}
                      />
                    </label>
                    {draftNeedsStack ? (
                    <label className="dev-composer__field">
                      <span>{t.stackPlaceholder}</span>
                        <input
                          type="text"
                          placeholder={draftStackPlaceholder}
                          value={draftStack}
                          onChange={(event) => setDraftStack(event.target.value)}
                        />
                    </label>
                    ) : null}
                  </div>
                </div>
                {draftShowsRepo || draftShowsDemo ? (
                <div className="dev-composer__group">
                  <p className="dev-composer__eyebrow">{t.composerLinks}</p>
                  <div className="dev-composer__row">
                    {draftShowsRepo ? (
                      <label className="dev-composer__field">
                        <span>{t.repoPlaceholder}</span>
                        <input
                          type="url"
                          placeholder={t.repoPlaceholder}
                          value={draftRepoUrl}
                          onChange={(event) => setDraftRepoUrl(event.target.value)}
                        />
                      </label>
                    ) : null}
                    {draftShowsDemo ? (
                      <label className="dev-composer__field">
                        <span>{t.demoPlaceholder}</span>
                        <input
                          type="url"
                          placeholder={t.demoPlaceholder}
                          value={draftDemoUrl}
                          onChange={(event) => setDraftDemoUrl(event.target.value)}
                        />
                      </label>
                    ) : null}
                  </div>
                  <div className="dev-composer__row dev-composer__row--actions">
                    <button type="button" onClick={() => void publishProject()}>
                      {draftActionLabel}
                    </button>
                  </div>
                </div>
                ) : (
                  <div className="dev-composer__row dev-composer__row--actions">
                    <button type="button" onClick={() => void publishProject()}>
                      {draftActionLabel}
                    </button>
                  </div>
                )}
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
                <span>{statusLabel(compareLeft.status, t)}</span>
                <span>{compareLeft.stack}</span>
              </article>
              <article>
                <strong>{compareRight.title}</strong>
                <span>{statusLabel(compareRight.status, t)}</span>
                <span>{compareRight.stack}</span>
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
            const views = statsMap[project.id] ?? 0;
            const metaItems = [
              project.stack.trim(),
              project.updated.trim(),
            ].filter(Boolean);

            return (
              <article
                key={project.id}
                className={`dev-card${compact ? " dev-card--compact" : ""}${publishedId === project.id ? " dev-card--published" : ""}`}
              >
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
                      {metaItems.map((item) => (
                        <span key={`${project.id}-${item}`}>{item}</span>
                      ))}
                    </div>
                    <div className="dev-card__insights">
                      <span>{t.metricsViews}: {formatCompactMetric(views)}</span>
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
                    </div>
                </>
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
