"use client";
/* eslint-disable @next/next/no-img-element */

import { fetchProjectStatsMap, formatCompactMetric, formatWatchHours, recordProjectShare, type ProjectStats } from "../../../lib/project-stats";

type StudioProject = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  media_url: string | null;
  created_at: string | null;
};

type StudioProjectDrawerProps = {
  tx: (es: string, en: string) => string;
  selectedProject: StudioProject;
  selectedProjectStats: ProjectStats | null;
  selectedProjectMediaUrl: string;
  isOwner: boolean;
  editTitle: string;
  setEditTitle: (value: string) => void;
  editDescription: string;
  setEditDescription: (value: string) => void;
  editType: string;
  setEditType: (value: string) => void;
  editSaving: boolean;
  editMessage: string | null;
  deleteBusy: boolean;
  deleteCandidateId: string | null;
  setDeleteCandidateId: (value: string | null) => void;
  linkCopied: boolean;
  setLinkCopied: (value: boolean) => void;
  copyTimeoutRef: React.RefObject<number | null>;
  projectPanelRef: React.RefObject<HTMLDivElement | null>;
  sessionId: string | null | undefined;
  supabaseReady: boolean;
  setEditMessage: (value: string | null) => void;
  setEditSaving: (value: boolean) => void;
  setDeleteBusy: (value: boolean) => void;
  setProjects: React.Dispatch<React.SetStateAction<StudioProject[]>>;
  setSelectedProject: (project: StudioProject | null) => void;
  setProjectStatsMap: React.Dispatch<React.SetStateAction<Record<string, ProjectStats>>>;
  onClose: () => void;
};

export function StudioProjectDrawer(props: StudioProjectDrawerProps) {
  const {
    tx,
    selectedProject,
    selectedProjectStats,
    selectedProjectMediaUrl,
    isOwner,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editType,
    setEditType,
    editSaving,
    editMessage,
    deleteBusy,
    deleteCandidateId,
    setDeleteCandidateId,
    linkCopied,
    setLinkCopied,
    copyTimeoutRef,
    projectPanelRef,
    sessionId,
    supabaseReady,
    setEditMessage,
    setEditSaving,
    setDeleteBusy,
    setProjects,
    setSelectedProject,
    setProjectStatsMap,
    onClose,
  } = props;

  return (
    <div className="studio-projects__overlay" onClick={onClose}>
      <div className="studio-projects__drawer" ref={projectPanelRef} onClick={(event) => event.stopPropagation()}>
        <div className="studio-projects__drawer-head">
          <div>
            <h3>{selectedProject.title ?? "Proyecto"}</h3>
            <p>{selectedProject.description ?? "Sin descripcion"}</p>
          </div>
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="studio-projects__preview">
          {selectedProject.type === "video" && selectedProjectMediaUrl ? (
            <video src={selectedProjectMediaUrl} controls playsInline />
          ) : selectedProjectMediaUrl ? (
            <img src={selectedProjectMediaUrl} alt={selectedProject.title ?? "Proyecto"} />
          ) : (
            <div className="studio-projects__hint">{tx("Sin media", "No media")}</div>
          )}
        </div>
        {isOwner ? (
          <div className="studio-projects__edit">
            <div className="studio-projects__edit-preview">
              <span>Vista previa</span>
              {selectedProject.type === "video" && selectedProjectMediaUrl ? (
                <video src={selectedProjectMediaUrl} controls playsInline />
              ) : selectedProjectMediaUrl ? (
                <img src={selectedProjectMediaUrl} alt={selectedProject.title ?? "Proyecto"} />
              ) : (
                <div className="studio-projects__hint">{tx("Sin media", "No media")}</div>
              )}
              <button
                type="button"
                className="studio-projects__open"
                onClick={() => {
                  const base = typeof window !== "undefined" ? window.location.origin : "";
                  window.open(`${base}/visuales/proyecto/${selectedProject.id}`, "_blank", "noopener,noreferrer");
                }}
              >
                Abrir pagina del proyecto
              </button>
            </div>
            <label>
              Titulo
              <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </label>
            <label>
              Descripcion
              <textarea
                rows={3}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <label>
              Tipo
              <select value={editType} onChange={(event) => setEditType(event.target.value)}>
                <option value="imagen">Imagen</option>
                <option value="video">Video</option>
                <option value="animacion">Animacion</option>
                <option value="interactivo">Interactivo</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            {editMessage ? <p className="studio-settings__message">{editMessage}</p> : null}
            <button
              type="button"
              className="studio-dashboard__action"
              disabled={editSaving || deleteBusy}
              onClick={async () => {
                if (!supabaseReady || !sessionId) {
                  setEditMessage("Inicia sesion para editar.");
                  return;
                }
                setEditSaving(true);
                setEditMessage(null);
                const { supabase } = await import("../../../lib/supabase");
                const { error } = await supabase!
                  .from("projects")
                  .update({
                    title: editTitle,
                    description: editDescription,
                    type: editType,
                  })
                  .eq("id", selectedProject.id)
                  .eq("user_id", sessionId);
                if (error) {
                  setEditMessage(error.message);
                  setEditSaving(false);
                  return;
                }
                const updated = {
                  ...selectedProject,
                  title: editTitle,
                  description: editDescription,
                  type: editType,
                };
                setSelectedProject(updated);
                setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                setEditSaving(false);
                setEditMessage("Cambios guardados.");
              }}
            >
              {editSaving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="studio-dashboard__action studio-dashboard__action--ghost"
              disabled={editSaving || deleteBusy}
              onClick={() => setDeleteCandidateId(selectedProject.id)}
            >
              Eliminar proyecto
            </button>
            {deleteCandidateId === selectedProject.id ? (
              <div className="studio-settings__message">
                Vas a eliminar este proyecto definitivamente.
                <div className="studio-projects__actions">
                  <button
                    type="button"
                    className="studio-dashboard__action"
                    disabled={deleteBusy || editSaving}
                    onClick={async () => {
                      if (!supabaseReady || !sessionId) {
                        setEditMessage("Inicia sesion para editar.");
                        return;
                      }
                      setDeleteBusy(true);
                      setEditMessage(null);
                      try {
                        const { supabase } = await import("../../../lib/supabase");
                        const mediaUrl = selectedProjectMediaUrl;
                        if (mediaUrl.includes("/storage/v1/object/public/projects/")) {
                          const [, path] = mediaUrl.split("/storage/v1/object/public/projects/");
                          if (path) {
                            const { error: storageError } = await supabase!.storage.from("projects").remove([path]);
                            if (storageError) {
                              setEditMessage(storageError.message);
                            }
                          }
                        }
                        const { error } = await supabase!
                          .from("projects")
                          .delete()
                          .eq("id", selectedProject.id)
                          .eq("user_id", sessionId);
                        if (error) {
                          setEditMessage(error.message);
                          return;
                        }
                        setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));
                        setSelectedProject(null);
                        setDeleteCandidateId(null);
                      } finally {
                        setDeleteBusy(false);
                      }
                    }}
                  >
                    {deleteBusy ? "Eliminando..." : "Confirmar eliminacion"}
                  </button>
                  <button
                    type="button"
                    className="studio-dashboard__action studio-dashboard__action--ghost"
                    disabled={deleteBusy}
                    onClick={() => setDeleteCandidateId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="studio-projects__actions">
          <button
            type="button"
            className="studio-dashboard__action studio-dashboard__action--ghost"
            onClick={() => {
              const base = typeof window !== "undefined" ? window.location.origin : "";
              window.open(`${base}/visuales/proyecto/${selectedProject.id}`, "_blank", "noopener,noreferrer");
            }}
          >
            Ver pagina del proyecto
          </button>
        </div>
        <div className="studio-projects__stats">
          <div>
            <span>Likes</span>
            <strong>{formatCompactMetric(selectedProjectStats?.likes_count ?? 0)}</strong>
          </div>
          <div>
            <span>Vistas</span>
            <strong>{formatCompactMetric(selectedProjectStats?.views_count ?? 0)}</strong>
          </div>
          {selectedProject.type === "video" ? (
            <div>
              <span>Horas de reproduccion</span>
              <strong>{formatWatchHours(selectedProjectStats?.watch_seconds ?? 0)}</strong>
            </div>
          ) : null}
          <div>
            <span>Compartidos</span>
            <strong>{formatCompactMetric(selectedProjectStats?.shares_count ?? 0)}</strong>
          </div>
        </div>
        <div className="studio-projects__share">
          <span>Link publico</span>
          <input
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/visuales/proyecto/${selectedProject.id}`}
            onClick={(event) => {
              const linkValue = (event.currentTarget as HTMLInputElement).value;
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(linkValue);
              } else {
                document.execCommand("copy");
              }
              setLinkCopied(true);
              if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
              }
              copyTimeoutRef.current = window.setTimeout(() => {
                setLinkCopied(false);
              }, 1800);
              recordProjectShare(selectedProject.id)
                .then(() => fetchProjectStatsMap([selectedProject.id]))
                .then((nextStats) => {
                  setProjectStatsMap((prev) => ({ ...prev, ...nextStats }));
                })
                .catch(() => undefined);
            }}
            className={linkCopied ? "is-copied" : ""}
          />
          <span className={`studio-projects__share-hint${linkCopied ? " is-visible" : ""}`}>
            Link copiado
          </span>
        </div>
      </div>
    </div>
  );
}

