/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../components/site-shell";
import { supabase } from "../lib/supabase";
import { useVisualesIdentity } from "./use-visuales-identity";

export default function VisualesHubPage() {
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
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("imagen");
  const [file, setFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("hub");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsPage, setProjectsPage] = useState(0);
  const [projectsHasMore, setProjectsHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const inicioRef = useRef<HTMLDivElement | null>(null);
  const feedRef = useRef<HTMLElement | null>(null);

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
      if (!supabase || loadingRef.current) {
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

  const filteredProjects = useMemo(() => {
    if (!activeType) {
      return projects;
    }
    return projects.filter((project) => project.type === activeType);
  }, [activeType, projects]);

  const handleNavClick = (next: string) => {
    setActiveNav(next);
    if (next === "directos") {
      setActiveType("video");
      feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next === "cabinas") {
      setActiveType("interactivo");
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
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      return;
    }
    if (next === "hub") {
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

  const canUpload = Boolean(sessionUser);

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    router.push("/visuales/auth");
  };

  const handleSwitchAccount = async () => {
    await handleSignOut();
  };

  const handleRequireAuth = () => {
    router.push("/visuales/auth");
  };

  const handleMyCabina = () => {
    if (sessionUser === undefined) {
      return;
    }
    if (username) {
      router.push(`/visuales/estudio/@${username}`);
      return;
    }
    router.push("/visuales/auth");
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionUser) {
      setError("Necesitas iniciar sesion para subir proyectos.");
      return;
    }
    if (!file) {
      setError("Selecciona un archivo.");
      return;
    }
    if (!supabase) {
      setError("Supabase no esta configurado.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const extension = file.name.split(".").pop() || "file";
      const filePath = `${sessionUser}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("projects").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { data: publicData } = supabase.storage.from("projects").getPublicUrl(filePath);
      const mediaUrl = publicData.publicUrl;
      const { error: insertError } = await supabase.from("projects").insert({
        user_id: sessionUser,
        title,
        description,
        type,
        media_url: mediaUrl,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setTitle("");
      setDescription("");
      setType("imagen");
      setFile(null);
    } finally {
      setUploading(false);
    }
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
          <button type="button" className="hub-upload-button" onClick={() => setShowUpload((prev) => !prev)}>
            Subir proyecto
          </button>
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
                        handleMyCabina();
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
              onClick={() => handleNavClick("inicio")}
            >
              Inicio
            </button>
            <button
              type="button"
              className={activeNav === "hub" ? "active" : ""}
              onClick={() => handleNavClick("hub")}
            >
              Visuales Hub
            </button>
            <button
              type="button"
              className={activeNav === "explorar" ? "active" : ""}
              onClick={() => handleNavClick("explorar")}
            >
              Explorar
            </button>
            <button
              type="button"
              className={activeNav === "cabinas" ? "active" : ""}
              onClick={() => handleNavClick("cabinas")}
            >
              Cabinas
            </button>
            <button
              type="button"
              className={activeNav === "suscripciones" ? "active" : ""}
              onClick={() => handleNavClick("suscripciones")}
            >
              Suscripciones
            </button>
            <button
              type="button"
              className={activeNav === "directos" ? "active" : ""}
              onClick={() => handleNavClick("directos")}
            >
              Directos
            </button>
            <button
              type="button"
              className={activeNav === "historial" ? "active" : ""}
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
          <p>Tipos de contenido</p>
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

      <main className="hub-main">
        <div ref={inicioRef} className="hub-anchor" />
        {showUpload ? (
          <section className="hub-upload-inline">
            <div className="hub-section__header">
              <h2>Subir proyecto</h2>
              <button type="button" onClick={() => setShowUpload(false)}>
                Cerrar
              </button>
            </div>
            {canUpload ? (
              <form onSubmit={handleUpload}>
                <label>
                  Titulo
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required />
                </label>
                <label>
                  Descripcion
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
                </label>
                <label>
                  Tipo
                  <select value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="imagen">Imagen</option>
                    <option value="video">Video</option>
                    <option value="animacion">Animacion</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label>
                  Archivo
                  <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
                </label>
                <button type="submit" disabled={uploading}>
                  {uploading ? "Subiendo..." : "Publicar"}
                </button>
              </form>
            ) : (
              <div className="hub-locked">
                <p>Necesitas una cuenta para publicar.</p>
                <button type="button" onClick={handleRequireAuth}>
                  Iniciar sesion para publicar
                </button>
              </div>
            )}
            {error ? <p className="hub-error">{error}</p> : null}
          </section>
        ) : null}
        <section className="hub-feed" ref={feedRef}>
          {projectsLoading && projects.length === 0 ? (
            <div className="hub-feed__grid hub-feed__grid--skeleton" aria-hidden>
              {Array.from({ length: 9 }).map((_, index) => (
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
          {initialLoaded && !projectsLoading && projects.length === 0 ? (
            <div className="hub-feed__empty">
              <p>No hay proyectos publicados aun.</p>
            </div>
          ) : null}
          {!projectsLoading && filteredProjects.length > 0 ? (
            <div className="hub-feed__grid">
              {filteredProjects.map((project, index) => (
                <Link
                  key={project.id}
                  href={`/visuales/proyecto/${project.id}`}
                  className="hub-card"
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
                          {getInitial(project.profiles?.username ?? project.profiles?.display_name) || "<"}
                        </span>
                        <div>
                          <h3>{project.title ?? "Proyecto"}</h3>
                          <p>@{(project.profiles?.username ?? "creador").replace(/^@+/, "")} - 2.1k vistas</p>
                        </div>
                      </div>
                      <p>{project.description ?? ""}</p>
                    </div>
                </Link>
              ))}
            </div>
          ) : null}
          {!projectsLoading && filteredProjects.length === 0 && projects.length > 0 ? (
            <div className="hub-feed__empty">
              <p>No hay proyectos para este filtro.</p>
            </div>
          ) : null}
          <div ref={feedSentinelRef} className="hub-feed__sentinel" />
        </section>
      </main>
    </SiteShell>
  );
}
