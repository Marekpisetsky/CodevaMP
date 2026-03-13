"use client";
/* eslint-disable @next/next/no-img-element */

type StudioSort = "newest" | "oldest" | "title-az" | "title-za";

type StudioProject = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  media_url: string | null;
  created_at: string | null;
};

type StudioProjectsPanelProps = {
  tx: (es: string, en: string) => string;
  visibleProjects: StudioProject[];
  projectSearch: string;
  setProjectSearch: (value: string) => void;
  projectSort: StudioSort;
  setProjectSort: (value: StudioSort) => void;
  projectsLoading: boolean;
  hasProjectSearch: boolean;
  compactProjectGrid: boolean;
  autoplayPreview: boolean;
  onSelectProject: (project: StudioProject) => void;
};

const resolveMediaUrl = (value: string | null | undefined) => (value ?? "").trim();

export function StudioProjectsPanel(props: StudioProjectsPanelProps) {
  const {
    tx,
    visibleProjects,
    projectSearch,
    setProjectSearch,
    projectSort,
    setProjectSort,
    projectsLoading,
    hasProjectSearch,
    compactProjectGrid,
    autoplayPreview,
    onSelectProject,
  } = props;

  return (
    <section className="studio-projects__list">
      <div className="studio-projects__header">
        <div className="studio-projects__toolbar">
          <input
            type="search"
            placeholder={tx("Filtrar proyectos por titulo, tipo o descripcion...", "Filter projects by title, type, or description...")}
            value={projectSearch}
            onChange={(event) => setProjectSearch(event.target.value)}
            aria-label={tx("Filtrar proyectos", "Filter projects")}
          />
          <select
            value={projectSort}
            onChange={(event) => setProjectSort(event.target.value as StudioSort)}
            aria-label={tx("Ordenar proyectos", "Sort projects")}
          >
            <option value="newest">{tx("Mas recientes", "Newest")}</option>
            <option value="oldest">{tx("Mas antiguos", "Oldest")}</option>
            <option value="title-az">{tx("Titulo A-Z", "Title A-Z")}</option>
            <option value="title-za">{tx("Titulo Z-A", "Title Z-A")}</option>
          </select>
        </div>
        <span>{visibleProjects.length} {tx("resultado(s)", "result(s)")}</span>
        {projectsLoading ? <span>{tx("Cargando...", "Loading...")}</span> : null}
      </div>
      {visibleProjects.length === 0 && !projectsLoading ? (
        hasProjectSearch ? (
          <p className="studio-projects__hint">
            No encontramos proyectos con &quot;{projectSearch.trim()}&quot;.
          </p>
        ) : (
          <p className="studio-projects__hint">Aun no has publicado proyectos.</p>
        )
      ) : (
        ["imagen", "video", "animacion", "interactivo", "otro"].map((category) => {
          const items = visibleProjects.filter((project) => (project.type ?? "otro") === category);
          if (!items.length) {
            return null;
          }
          return (
            <div key={category} className="studio-projects__category">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <div className={`studio-projects__grid${compactProjectGrid ? " is-compact" : ""}`}>
                {items.map((project) => (
                  <article
                    key={project.id}
                    className="studio-projects__card"
                    onClick={() => onSelectProject(project)}
                  >
                    <button
                      type="button"
                      className="studio-projects__card-hitbox"
                      aria-label={tx("Abrir detalles del proyecto", "Open project details")}
                      onClick={() => onSelectProject(project)}
                    />
                    <div className="studio-projects__media" onClick={() => onSelectProject(project)}>
                      {(() => {
                        const mediaUrl = resolveMediaUrl(project.media_url);
                        if (project.type === "video" && mediaUrl) {
                          return (
                            <video
                              src={mediaUrl}
                              muted
                              playsInline
                              autoPlay={autoplayPreview}
                              loop={autoplayPreview}
                            />
                          );
                        }
                        if (mediaUrl) {
                          return <img src={mediaUrl} alt={project.title ?? tx("Proyecto", "Project")} />;
                        }
                        return <div className="studio-projects__hint">{tx("Sin media", "No media")}</div>;
                      })()}
                    </div>
                    <div className="studio-projects__meta" onClick={() => onSelectProject(project)}>
                      <h5>{project.title ?? tx("Proyecto sin titulo", "Untitled project")}</h5>
                      <p>{project.description ?? tx("Sin descripcion", "No description")}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

