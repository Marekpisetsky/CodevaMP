"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  initialProjects,
  mapDevProjectRow,
  type DevProject,
  type DevProjectRow,
} from "@/app/lib/dev-projects";
import { scoreProjectLocal } from "@/app/lib/dev-engine";
import { devSupabase as supabase } from "@/app/lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";

function canEmbedDemo(value: string) {
  const url = value.trim();
  if (!url) {
    return false;
  }
  return /^https?:\/\//i.test(url);
}

type QualityCheck = {
  id: string;
  label: string;
  done: boolean;
};

type ReleaseGate = {
  canPublish: boolean;
  reasons: string[];
};

type ProjectStatsRow = {
  project_id: string;
  views_count: number | null;
};

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
  const checklistScore = Math.round((pass / checks.length) * 100);
  const engineScore = scoreProjectLocal({
    title: project.title,
    summary: project.summary,
    stack: project.stack,
    hasRepo: Boolean(project.repoUrl),
    hasDemo: Boolean(project.demoUrl),
  });
  return Math.round(checklistScore * 0.72 + engineScore * 0.28);
}

function buildReleaseGate(
  isEs: boolean,
  project: DevProject,
  quality: number,
  views: number
): ReleaseGate {
  const reasons: string[] = [];
  if (quality < 75) {
    reasons.push(isEs ? "Checklist < 75%" : "Checklist < 75%");
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

function buildIdeaDevelopmentPrompts(project: DevProject, isEs: boolean) {
  const topic = project.title.toLowerCase();
  const summary = project.summary.toLowerCase();
  const persona =
    summary.includes("creador") || topic.includes("creator")
      ? isEs
        ? "Persona sugerida: creador independiente que quiere publicar algo usable sin perder tiempo en setup."
        : "Suggested persona: independent creator who wants to ship something usable without wasting time on setup."
      : summary.includes("equipo") || summary.includes("team")
        ? isEs
          ? "Persona sugerida: equipo pequeño que necesita coordinar entregables sin meter complejidad innecesaria."
          : "Suggested persona: small team that needs to coordinate deliverables without unnecessary complexity."
        : isEs
          ? "Persona sugerida: usuario con criterio tecnico medio que necesita resolver una tarea concreta rapido."
          : "Suggested persona: user with mid-level technical judgment who needs to solve one concrete task fast.";

  return [
    persona,
    isEs
      ? "Problema central: define que friccion elimina esta idea antes de pensar en features."
      : "Core problem: define which friction this idea removes before thinking about features.",
    isEs
      ? "Entregable inicial: decide la experiencia minima que un desarrollador debe volver funcional en la primera version."
      : "Initial deliverable: decide the minimum experience a developer must make functional in the first version.",
    isEs
      ? "Validacion: fija una senal observable de exito, no una promesa abstracta."
      : "Validation: define one observable success signal, not an abstract promise.",
  ];
}

export default function DevProjectPage() {
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const router = useRouter();
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
    baseIdeas: isEs ? "Ideas base" : "Base ideas",
    baseIdeasHint: isEs
      ? "Estas ideas funcionan como contexto de origen para este proyecto."
      : "These ideas act as origin context for this project.",
    noBaseIdeas: isEs
      ? "Este proyecto no tiene ideas vinculadas."
      : "This project has no linked ideas.",
    openIdea: isEs ? "Abrir idea" : "Open idea",
    deriveProject: isEs ? "Crear version derivada" : "Create derived version",
    devSuggestions: isEs ? "Sugerencias de desarrollo" : "Development suggestions",
    devSuggestionsHint: isEs
      ? "Usa esta idea como brief inicial. El desarrollo puede reinterpretarla, pero no deberia perder su problema central."
      : "Use this idea as the initial brief. Development can reinterpret it, but it should not lose the core problem.",
    manageProject: isEs ? "Gestion del proyecto" : "Project management",
    manageProjectHint: isEs
      ? "Las acciones de edicion y borrado viven aqui, no en el feed."
      : "Editing and delete actions live here, not in the feed.",
    editMeta: isEs ? "Editar metadatos" : "Edit metadata",
    closeEditor: isEs ? "Cerrar editor" : "Close editor",
    saveChanges: isEs ? "Guardar cambios" : "Save changes",
    deleteProject: isEs ? "Eliminar proyecto" : "Delete project",
    moveToBuild: isEs ? "Pasar a construir" : "Move to build",
    moveToPublish: isEs ? "Pasar a publicar" : "Move to publish",
    saveOk: isEs ? "Proyecto actualizado." : "Project updated.",
    deleteOk: isEs ? "Proyecto eliminado." : "Project deleted.",
    saveError: isEs ? "No se pudo actualizar el proyecto." : "Unable to update project.",
    deleteError: isEs ? "No se pudo eliminar el proyecto." : "Unable to delete project.",
    confirmDelete: isEs
      ? "Esta accion elimina el proyecto. Deseas continuar?"
      : "This action deletes the project. Do you want to continue?",
    titleLabel: isEs ? "Titulo" : "Title",
    summaryLabel: isEs ? "Resumen" : "Summary",
    stackLabel: isEs ? "Stack" : "Stack",
    collaborationLabel: isEs ? "Flujo" : "Flow",
    qualityChecklist: isEs ? "Checklist automatico" : "Auto checklist",
    releaseGateTitle: isEs ? "Gate de publicacion" : "Release gate",
    releaseGatePass: isEs ? "Aprobado para publicar" : "Approved for publish",
    publishBlocked: isEs ? "No cumple gate de publicacion." : "Release gate not satisfied.",
    publishReadiness: isEs ? "Preparacion de publicacion" : "Publishing readiness",
    metricsViews: isEs ? "Vistas" : "Views",
    metricsQuality: isEs ? "Calidad" : "Quality",
    devBrand: "Dev",
  };
  const params = useParams<{ id: string | string[] }>();
  const routeId = params?.id;
  const projectId = Array.isArray(routeId) ? routeId[0] : routeId;
  const fallbackCatalog = useMemo(() => initialProjects, []);
  const [project, setProject] = useState<DevProject | null>(null);
  const [linkedIdeas, setLinkedIdeas] = useState<DevProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editStack, setEditStack] = useState("");
  const [editLookingFor, setEditLookingFor] = useState("");
  const developmentPrompts = useMemo(
    () => (project?.status === "idea" ? buildIdeaDevelopmentPrompts(project, isEs) : []),
    [project, isEs]
  );
  const isOwner = Boolean(project && sessionUserId && project.ownerId === sessionUserId);

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
    let active = true;
    if (!projectId) {
      setError(t.invalidId);
      setLoading(false);
      return;
    }

    const localMatch = fallbackCatalog.find((item) => item.id === projectId);
    if (localMatch) {
      setProject(localMatch);
      setLinkedIdeas(
        fallbackCatalog.filter(
          (item) => item.status === "idea" && localMatch.linkedIdeaIds.includes(item.id)
        )
      );
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

      const mappedProject = mapDevProjectRow(data as DevProjectRow);
      setProject(mappedProject);
      setEditTitle(mappedProject.title);
      setEditSummary(mappedProject.summary);
      setEditStack(mappedProject.stack);
      setEditLookingFor(mappedProject.lookingFor);
      const { data: linkRows } = await supabase
        .from("dev_project_idea_links")
        .select("idea_id")
        .eq("project_id", projectId);

      const linkedIds = Array.from(
        new Set(((linkRows as Array<{ idea_id: string }> | null) ?? []).map((row) => row.idea_id).filter(Boolean))
      );

      if (linkedIds.length > 0) {
        const { data: ideasData } = await supabase
          .from("dev_projects")
          .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
          .in("id", linkedIds)
          .eq("status", "idea")
          .order("created_at", { ascending: false });

        if (active && ideasData) {
          setLinkedIdeas((ideasData as DevProjectRow[]).map(mapDevProjectRow));
        }
      } else if (active) {
        setLinkedIdeas([]);
      }
      setLoading(false);
    };

    void load();
    return () => {
      active = false;
    };
  }, [fallbackCatalog, projectId, t.invalidId, t.notFound]);

  useEffect(() => {
    let active = true;
    const loadViews = async () => {
      if (!supabase || !projectId) {
        if (active) setViews(0);
        return;
      }
      const { data } = await supabase
        .from("project_stats")
        .select("project_id, views_count")
        .eq("project_id", projectId)
        .maybeSingle();

      if (!active) return;
      const row = data as ProjectStatsRow | null;
      setViews(Number(row?.views_count ?? 0));
    };

    void loadViews();
    return () => {
      active = false;
    };
  }, [projectId]);

  const updateProject = async (patch: Partial<Pick<DevProjectRow, "title" | "summary" | "stack" | "looking_for" | "status">>) => {
    if (!project || !supabase) return;
    setError(null);
    setInfo(null);
    const { data, error: updateError } = await supabase
      .from("dev_projects")
      .update(patch)
      .eq("id", project.id)
      .select("id,title,summary,stack,repo_url,demo_url,looking_for,status,author_handle,created_by,created_at")
      .single();

    if (updateError || !data) {
      setError(t.saveError);
      return;
    }

    const nextProject = {
      ...mapDevProjectRow(data as DevProjectRow),
      linkedIdeaIds: project.linkedIdeaIds,
    };
    setProject(nextProject);
    setEditTitle(nextProject.title);
    setEditSummary(nextProject.summary);
    setEditStack(nextProject.stack);
    setEditLookingFor(nextProject.lookingFor);
    setIsEditing(false);
    setInfo(t.saveOk);
  };

  const saveProjectMeta = async () => {
    const title = editTitle.trim();
    const summary = editSummary.trim();
    if (!title || !summary) {
      setError(t.saveError);
      return;
    }
    await updateProject({
      title,
      summary,
      stack: editStack.trim(),
      looking_for: editLookingFor.trim(),
    });
  };

  const moveProjectStatus = async (nextStatus: DevProject["status"]) => {
    if (!project) return;
    if (nextStatus === "live") {
      const quality = qualityScore(project, isEs);
      const gate = buildReleaseGate(isEs, project, quality, views);
      if (!gate.canPublish) {
        setError(`${t.publishBlocked} ${gate.reasons.join(" · ")}`);
        return;
      }
    }
    await updateProject({ status: nextStatus });
  };

  const removeProject = async () => {
    if (!project || !supabase) return;
    if (typeof window !== "undefined" && !window.confirm(t.confirmDelete)) return;
    setError(null);
    setInfo(null);
    const { error: deleteError } = await supabase.from("dev_projects").delete().eq("id", project.id);
    if (deleteError) {
      setError(t.deleteError);
      return;
    }
    setInfo(t.deleteOk);
    router.push("/dev");
    router.refresh();
  };

  const checks = useMemo(
    () => (project ? buildQualityChecks(project, isEs) : []),
    [project, isEs]
  );
  const quality = useMemo(
    () => (project ? qualityScore(project, isEs) : 0),
    [project, isEs]
  );
  const releaseGate = useMemo(
    () => (project ? buildReleaseGate(isEs, project, quality, views) : { canPublish: false, reasons: [] }),
    [project, isEs, quality, views]
  );

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
        {!loading && info ? <section className="dev-card">{info}</section> : null}

        {!loading && project ? (
          <section className="dev-detail-layout">
            <article className="dev-card dev-detail-main" style={{ gap: "0.75rem", padding: "0.9rem" }}>
              <div className="dev-card__head">
                <h2>{project.title}</h2>
                <span className={`dev-status dev-status--${project.status}`}>{project.status}</span>
              </div>
              <p>{project.summary}</p>
              <div className="dev-card__meta">
                <span>{project.stack}</span>
                <span>{project.lookingFor}</span>
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
                {isOwner && project.status === "idea" ? (
                  <button type="button" onClick={() => void moveProjectStatus("building")}>
                    {t.moveToBuild}
                  </button>
                ) : null}
                {isOwner && project.status === "building" ? (
                  <button type="button" onClick={() => void moveProjectStatus("live")}>
                    {t.moveToPublish}
                  </button>
                ) : null}
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

              <section className="dev-card dev-detail-readiness">
                <div className="dev-card__head">
                  <h3>{t.publishReadiness}</h3>
                  <span className={`dev-status dev-status--${project.status}`}>{project.status}</span>
                </div>
                <div className="dev-card__insights">
                  <span>{t.metricsViews}: {views}</span>
                  <span>{t.metricsQuality}: {quality}%</span>
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
              </section>
            </article>

            <aside className="dev-card dev-detail-sidebar">
              {isOwner ? (
                <section className="dev-detail-sidebar__owner">
                  <div className="dev-detail-sidebar__head">
                    <h3>{t.manageProject}</h3>
                    <p>{t.manageProjectHint}</p>
                  </div>
                  <div className="dev-card__actions">
                    <button type="button" onClick={() => setIsEditing((current) => !current)}>
                      {isEditing ? t.closeEditor : t.editMeta}
                    </button>
                    <button type="button" onClick={() => void removeProject()}>
                      {t.deleteProject}
                    </button>
                  </div>
                  {isEditing ? (
                    <div className="dev-edit">
                      <label>
                        <span>{t.titleLabel}</span>
                        <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                      </label>
                      <label>
                        <span>{t.summaryLabel}</span>
                        <input value={editSummary} onChange={(event) => setEditSummary(event.target.value)} />
                      </label>
                      <label>
                        <span>{t.stackLabel}</span>
                        <input value={editStack} onChange={(event) => setEditStack(event.target.value)} />
                      </label>
                      <label>
                        <span>{t.collaborationLabel}</span>
                        <input value={editLookingFor} onChange={(event) => setEditLookingFor(event.target.value)} />
                      </label>
                      <div className="dev-card__actions">
                        <button type="button" onClick={() => void saveProjectMeta()}>
                          {t.saveChanges}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
              {project.status === "idea" ? (
                <>
                  <div className="dev-detail-sidebar__head">
                    <h3>{t.devSuggestions}</h3>
                    <p>{t.devSuggestionsHint}</p>
                  </div>
                  <div className="dev-detail-sidebar__list">
                    {developmentPrompts.map((prompt) => (
                      <article key={prompt} className="dev-detail-sidebar__item dev-detail-sidebar__item--compact">
                        <p>{prompt}</p>
                      </article>
                    ))}
                  </div>
                  <div className="dev-card__actions">
                    <Link href={`/dev?flow=build&fromIdea=${project.id}`} prefetch>
                      {t.deriveProject}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="dev-detail-sidebar__head">
                    <h3>{t.baseIdeas}</h3>
                    <p>{t.baseIdeasHint}</p>
                  </div>

                  {linkedIdeas.length > 0 ? (
                    <div className="dev-detail-sidebar__list">
                      {linkedIdeas.map((idea) => (
                        <article key={idea.id} className="dev-detail-sidebar__item dev-detail-sidebar__item--compact">
                          <div className="dev-detail-sidebar__item-head">
                            <strong>{idea.title}</strong>
                          </div>
                          <p>{idea.summary}</p>
                          <div className="dev-card__actions">
                            <Link href={`/dev/proyecto/${idea.id}`} prefetch>
                              {t.openIdea}
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="dev-empty">{t.noBaseIdeas}</p>
                  )}
                </>
              )}
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
