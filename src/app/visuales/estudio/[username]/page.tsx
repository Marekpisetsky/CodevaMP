/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../../../components/site-shell";
import { supabase } from "../../../lib/supabase";

type VisualesEstudioPageProps = {
  params: {
    username: string;
  };
};

export default function VisualesEstudioPage({ params }: VisualesEstudioPageProps) {
  const router = useRouter();
  const { username } = React.use(params as unknown as Promise<{ username: string }>);
  const studioName = decodeURIComponent(username);
  const normalizeSlug = (value: string) => value.trim().replace(/^@/, "").toLowerCase();
  const avatarInitial = studioName.replace(/^@/, "").slice(0, 1).toUpperCase() || "U";
  const [activeSection, setActiveSection] = useState<
    "subidas" | "proyectos" | "pagos" | "acuerdos" | "preferencias" | "personalizar"
  >("subidas");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settingsName, setSettingsName] = useState("");
  const [settingsUsername, setSettingsUsername] = useState(studioName.replace(/^@/, ""));
  const [settingsBio, setSettingsBio] = useState("");
  const [usernameUpdatedAt, setUsernameUpdatedAt] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadType, setUploadType] = useState("imagen");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [needsTypeChoice, setNeedsTypeChoice] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const uploadPreviewRef = useRef<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [projects, setProjects] = useState<
    Array<{
      id: string;
      title: string | null;
      description: string | null;
      type: string | null;
      media_url: string | null;
      created_at: string | null;
    }>
  >([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    title: string | null;
    description: string | null;
    type: string | null;
    media_url: string | null;
    created_at: string | null;
  } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("imagen");
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sectionCopy = useMemo(
    () => ({
      subidas: {
        title: "Subidas",
        subtitle: "Carga y publica nuevos proyectos.",
        empty: "Sube tu primer proyecto para que aparezca aqui.",
      },
      proyectos: {
        title: "Proyectos",
        subtitle: "Todo lo que has publicado, ordenado por categoria.",
        empty: "Aun no tienes proyectos publicados.",
      },
      pagos: {
        title: "Pagos",
        subtitle: "Configura tus pagos y revisa tu historial.",
        empty: "No hay pagos registrados por ahora.",
      },
      acuerdos: {
        title: "Acuerdos",
        subtitle: "Gestiona permisos y colaboraciones.",
        empty: "No tienes acuerdos activos.",
      },
      preferencias: {
        title: "Preferencias",
        subtitle: "Configura notificaciones y comportamiento general.",
        empty: "No hay preferencias avanzadas disponibles por ahora.",
      },
      personalizar: {
        title: "Personalizar",
        subtitle: "Actualiza tu logo, nombre y datos del estudio.",
        empty: "Configura tu cuenta y datos del estudio.",
      },
    }),
    []
  );
  const currentSection = sectionCopy[activeSection];

  const normalizedSlug = normalizeSlug(studioName);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current || !event.target) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id ?? null;
      setSessionId(userId);
      const metaUsername = normalizeSlug(
        (data.session?.user.user_metadata?.username as string | undefined) ?? ""
      );
      if (metaUsername && metaUsername === normalizedSlug) {
        setIsOwner(true);
        setSettingsUsername(metaUsername);
        setSettingsName((data.session?.user.user_metadata?.display_name as string | undefined) ?? "");
      }
      if (!metaUsername) {
        try {
          const storedUsername = normalizeSlug(sessionStorage.getItem("visuales-username") ?? "");
          if (storedUsername && storedUsername === normalizedSlug) {
            setIsOwner(true);
          }
        } catch {
          // ignore
        }
      }
      if (!userId) {
        return;
      }
      if (!supabase) {
        return;
      }
      supabase
        .from("profiles")
        .select("username, display_name, bio, username_updated_at")
        .eq("id", userId)
        .single()
        .then(({ data: profile }) => {
          if (!profile) {
            return;
          }
          setSettingsUsername(profile.username ?? "");
          setSettingsName(profile.display_name ?? "");
          setSettingsBio(profile.bio ?? "");
          setUsernameUpdatedAt(profile.username_updated_at ?? null);
          const profileSlug = normalizeSlug(profile.username ?? "");
          setIsOwner(profileSlug === normalizedSlug);
        });
    });
  }, [normalizedSlug]);

  useEffect(() => {
    if (!supabase || !sessionId || !isOwner) {
      return;
    }
    setProjectsLoading(true);
    supabase
      .from("projects")
      .select("id, title, description, type, media_url, created_at")
      .eq("user_id", sessionId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setProjects([]);
          setProjectsLoading(false);
          return;
        }
        setProjects((data as typeof projects) ?? []);
        setProjectsLoading(false);
      });
  }, [sessionId, isOwner]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    setEditTitle(selectedProject.title ?? "");
    setEditDescription(selectedProject.description ?? "");
    setEditType((selectedProject.type ?? "imagen").toLowerCase());
    setEditMessage(null);
  }, [selectedProject]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      if (uploadPreviewRef.current) {
        URL.revokeObjectURL(uploadPreviewRef.current);
      }
    };
  }, [logoPreview]);

  const normalizeUsername = (value: string) => value.trim().replace(/^@/, "").toLowerCase();
  const normalizeDisplayName = (value: string) => value.trim();

  const isValidUsername = (value: string) => {
    const normalized = normalizeUsername(value);
    if (normalized.length < 3 || normalized.length > 24) {
      return false;
    }
    return /^[a-z0-9-_]+$/.test(normalized);
  };

  const isValidDisplayName = (value: string) => {
    const normalized = normalizeDisplayName(value);
    return normalized.length >= 2 && normalized.length <= 40;
  };

  const daysBetween = (from: string) => {
    const fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) {
      return null;
    }
    const diffMs = Date.now() - fromDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleSaveSettings = async () => {
    if (!supabase || !sessionId) {
      setSettingsMessage("Inicia sesion para editar tu cuenta.");
      return;
    }
    if (!isOwner) {
      setSettingsMessage("Solo el propietario puede editar este estudio.");
      return;
    }
    const normalizedUser = normalizeUsername(settingsUsername);
    const normalizedName = normalizeDisplayName(settingsName);
    if (!isValidDisplayName(normalizedName)) {
      setSettingsMessage("Nombre invalido. Usa entre 2 y 40 caracteres.");
      return;
    }
    if (!isValidUsername(normalizedUser)) {
      setSettingsMessage("Usuario invalido. Usa 3-24 caracteres y solo letras, numeros, - o _.");
      return;
    }
    if (normalizedUser !== normalizedSlug && usernameUpdatedAt) {
      const days = daysBetween(usernameUpdatedAt);
      if (days !== null && days < 30) {
        setSettingsMessage(`Solo puedes cambiar tu usuario cada 30 dias. Faltan ${30 - days} dias.`);
        return;
      }
    }
    setSettingsBusy(true);
    setSettingsMessage(null);
    try {
      const { data: existing, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUser)
        .neq("id", sessionId)
        .limit(1);
      if (lookupError) {
        setSettingsMessage("No se pudo validar el usuario.");
        return;
      }
      if (existing && existing.length > 0) {
        setSettingsMessage("Ese usuario ya esta en uso. Elige otro.");
        return;
      }
      const updatePayload = {
        username: normalizedUser,
        display_name: normalizedName,
        bio: settingsBio.trim(),
        username_updated_at:
          normalizedUser !== normalizedSlug ? new Date().toISOString() : usernameUpdatedAt ?? new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").update(updatePayload).eq("id", sessionId);
      if (error) {
        setSettingsMessage(error.message);
        return;
      }
      await supabase.auth.updateUser({
        data: {
          username: normalizedUser,
          display_name: normalizedName,
        },
      });
      setUsernameUpdatedAt(updatePayload.username_updated_at ?? null);
      setSettingsMessage("Cambios guardados.");
      if (normalizedUser !== normalizedSlug) {
        router.replace(`/visuales/estudio/@${normalizedUser}`);
      }
    } finally {
      setSettingsBusy(false);
    }
  };

  const handleUpload = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setUploadError(null);
    setUploadProgress(null);
    if (!supabase || !sessionId) {
      setUploadError("Inicia sesion para subir proyectos.");
      return;
    }
    if (!uploadFile) {
      setUploadError("Selecciona un archivo.");
      return;
    }
    if (needsTypeChoice) {
      setUploadError("No pudimos detectar el tipo. Selecciona una categoria.");
      return;
    }
    setUploading(true);
    try {
      const extension = uploadFile.name.split(".").pop() || "file";
      const filePath = `${sessionId}/${Date.now()}.${extension}`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? "";
      if (!supabaseUrl || !supabaseKey || !accessToken) {
        setUploadError("Supabase no esta configurado.");
        return;
      }
      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/projects/${filePath}`;
      const uploadResult = await new Promise<Error | null>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadEndpoint, true);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("apikey", supabaseKey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("Content-Type", uploadFile.type || "application/octet-stream");
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(null);
            return;
          }
          if (xhr.status === 413) {
            resolve(new Error("Archivo demasiado grande para subir."));
            return;
          }
          resolve(new Error(xhr.responseText || "No se pudo subir el archivo."));
        };
        xhr.onerror = () => resolve(new Error("No se pudo subir el archivo."));
        xhr.send(uploadFile);
      });
      if (uploadResult) {
        setUploadError(uploadResult.message);
        return;
      }
      const { data: publicData } = supabase.storage.from("projects").getPublicUrl(filePath);
      const mediaUrl = publicData.publicUrl;
      const { error: insertError } = await supabase.from("projects").insert({
        user_id: sessionId,
        title: uploadTitle || uploadFile.name,
        description: uploadDescription,
        type: uploadType,
        media_url: mediaUrl,
      });
      if (insertError) {
        setUploadError(insertError.message);
        return;
      }
      setUploadTitle("");
      setUploadDescription("");
      setUploadType("imagen");
      setUploadFile(null);
      if (uploadPreviewRef.current) {
        URL.revokeObjectURL(uploadPreviewRef.current);
      }
      uploadPreviewRef.current = null;
      setUploadPreview(null);
      setNeedsTypeChoice(false);
      setUploadProgress(null);
      if (isOwner) {
        setProjectsLoading(true);
        supabase
          .from("projects")
          .select("id, title, description, type, media_url, created_at")
          .eq("user_id", sessionId)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            setProjects((data as typeof projects) ?? []);
          })
          .finally(() => setProjectsLoading(false));
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("El archivo es muy pesado. Usa un archivo menor a 50MB.");
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    setVideoReady(false);
    if (uploadPreviewRef.current) {
      URL.revokeObjectURL(uploadPreviewRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    uploadPreviewRef.current = previewUrl;
    setUploadPreview(previewUrl);
    const mime = file.type || "";
    if (mime.startsWith("video/")) {
      setUploadType("video");
      setNeedsTypeChoice(false);
      const tester = document.createElement("video");
      if (!tester.canPlayType(mime)) {
        setUploadError("Este formato no tiene vista previa. Usa MP4 o WebM.");
      }
    } else if (mime.startsWith("image/")) {
      setUploadType("imagen");
      setNeedsTypeChoice(false);
    } else {
      setNeedsTypeChoice(true);
    }
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      router.push("/visuales/auth");
      return;
    }
    await supabase.auth.signOut();
    router.push("/visuales/auth");
  };

  const handleSwitchAccount = async () => {
    setMenuOpen(false);
    await handleSignOut();
  };
  return (
    <SiteShell
      currentPath="/visuales"
      disableEffects
      className="visuales-cabina cabina-dashboard-page"
      brandHref="/visuales"
    >
      <main className="cabina-dashboard">
        <header className="cabina-dashboard__topbar">
          <div className="cabina-dashboard__brand">
            <div className="cabina-dashboard__brand-row">
              <div>
                <p className="cabina-eyebrow">Visuales Estudio</p>
                <h1>Tu espacio creativo</h1>
                <p className="cabina-dashboard__code">Estudio: {studioName}</p>
              </div>
              <button
                type="button"
                className="cabina-dashboard__action cabina-dashboard__action--ghost"
                onClick={() => {
                  setActiveSection("subidas");
                  handlePickFile();
                }}
                disabled={!isOwner}
              >
                Subir proyecto
              </button>
            </div>
          </div>
          <div className="cabina-dashboard__user">
            <span className="cabina-dashboard__status is-active">Activo</span>
            <div className="cabina-dashboard__menu" ref={menuRef}>
              <button
                type="button"
                className="visuales-avatar visuales-avatar--button"
                aria-label="Abrir menu de cuenta"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {avatarInitial}
              </button>
              {menuOpen ? (
                <div className="cabina-dashboard__menu-panel">
                  <div className="cabina-dashboard__menu-profile">
                    <div className="cabina-dashboard__menu-name">{settingsName || studioName.replace(/^@/, "")}</div>
                    <div className="cabina-dashboard__menu-handle">@{normalizeSlug(studioName)}</div>
                  </div>
                  <Link href="/visuales" onClick={() => setMenuOpen(false)}>
                    Ir al hub
                  </Link>
                  <button type="button" onClick={handleSwitchAccount}>
                    Cambiar cuenta
                  </button>
                  <button type="button" onClick={handleSignOut}>
                    Cerrar sesion
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <section className="cabina-dashboard__content">
          <aside className="cabina-dashboard__nav">
            <h3>Secciones</h3>
            <button
              type="button"
              className={activeSection === "subidas" ? "active" : ""}
              onClick={() => setActiveSection("subidas")}
            >
              Subidas
            </button>
            <button
              type="button"
              className={activeSection === "proyectos" ? "active" : ""}
              onClick={() => setActiveSection("proyectos")}
            >
              Proyectos
            </button>
            <button
              type="button"
              className={activeSection === "pagos" ? "active" : ""}
              onClick={() => setActiveSection("pagos")}
            >
              Pagos
            </button>
            <button
              type="button"
              className={activeSection === "acuerdos" ? "active" : ""}
              onClick={() => setActiveSection("acuerdos")}
            >
              Acuerdos
            </button>
            <button
              type="button"
              className={activeSection === "preferencias" ? "active" : ""}
              onClick={() => setActiveSection("preferencias")}
            >
              Preferencias
            </button>
            <button
              type="button"
              className={activeSection === "personalizar" ? "active" : ""}
              onClick={() => setActiveSection("personalizar")}
            >
              Personalizar
            </button>
          </aside>
          <div className="cabina-dashboard__main">
            <div className="cabina-dashboard__section-head">
              <div>
                <h2>{currentSection.title}</h2>
                <p>{currentSection.subtitle}</p>
              </div>
              {activeSection === "subidas" ? (
                <button
                  type="button"
                  className="cabina-dashboard__action"
                  onClick={() => {
                    if (!isOwner) {
                      setUploadError("Solo el propietario puede subir proyectos.");
                      return;
                    }
                    handlePickFile();
                  }}
                >
                  Subir proyecto
                </button>
              ) : null}
            </div>
            {activeSection === "subidas" ? (
              <section className="cabina-projects">
                <div
                  className={`cabina-dropzone${dragActive ? " is-active" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    if (!isOwner) {
                      setUploadError("Solo el propietario puede subir proyectos.");
                      return;
                    }
                    const file = event.dataTransfer.files?.[0] ?? null;
                    handleFileSelect(file);
                  }}
                  onClick={() => {
                    if (!isOwner) {
                      setUploadError("Solo el propietario puede subir proyectos.");
                      return;
                    }
                    handlePickFile();
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
                  />
                  <div>
                    <h3>Arrastra tu archivo aqui</h3>
                    <p>O haz click para seleccionar un archivo.</p>
                    {uploadPreview ? (
                      <div className="cabina-dropzone__preview">
                        {uploadType === "video" ? (
                          <>
                            {!videoReady ? <div className="cabina-dropzone__loading">Cargando vista previa...</div> : null}
                            <video
                              key={uploadPreview}
                              src={uploadPreview}
                              controls
                              muted
                              playsInline
                              preload="auto"
                              onLoadedMetadata={() => setVideoReady(true)}
                              onLoadedData={() => setVideoReady(true)}
                              onError={() => {
                                setUploadError("No se pudo cargar el video. Intenta de nuevo.");
                              }}
                            />
                          </>
                        ) : (
                          <img src={uploadPreview} alt={uploadFile?.name ?? "Vista previa"} />
                        )}
                      </div>
                    ) : null}
                    {uploadFile ? <p className="cabina-dropzone__file">{uploadFile.name}</p> : null}
                  </div>
                </div>
                {!isOwner ? <p className="cabina-projects__hint">Solo el propietario puede subir proyectos.</p> : null}
                {uploadFile ? (
                  <form className="cabina-upload-form" onSubmit={handleUpload}>
                    <label>
                      Titulo
                      <input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} required />
                    </label>
                    <label>
                      Descripcion
                      <textarea
                        rows={3}
                        value={uploadDescription}
                        onChange={(event) => setUploadDescription(event.target.value)}
                      />
                    </label>
                    <label>
                      Tipo
                      <select
                        value={uploadType}
                        onChange={(event) => {
                          setUploadType(event.target.value);
                          setNeedsTypeChoice(false);
                        }}
                        required={needsTypeChoice}
                      >
                        <option value="imagen">Imagen</option>
                        <option value="video">Video</option>
                        <option value="animacion">Animacion</option>
                        <option value="interactivo">Interactivo</option>
                        <option value="otro">Otro</option>
                      </select>
                    </label>
                    {uploadProgress !== null ? (
                      <div className="cabina-upload-progress">
                        <div>
                          <span>Subiendo archivo...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="cabina-upload-progress__bar">
                          <div style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : null}
                    {uploadError ? <p className="cabina-settings__message">{uploadError}</p> : null}
                    <button type="submit" className="cabina-dashboard__action" disabled={uploading || !uploadFile}>
                      {uploading ? "Subiendo..." : "Publicar"}
                    </button>
                  </form>
                ) : (
                  <p className="cabina-projects__hint">{currentSection.empty}</p>
                )}
                {uploadError && !uploadFile ? (
                  <p className="cabina-settings__message">{uploadError}</p>
                ) : null}
              </section>
            ) : (
              <div className="cabina-projects-empty">
                <p>{currentSection.empty}</p>
              </div>
            )}
            {activeSection === "proyectos" ? (
              <section className="cabina-projects__list">
                <div className="cabina-projects__header">
                  <h3>Proyectos por categoria</h3>
                  {projectsLoading ? <span>Cargando...</span> : null}
                </div>
                {projects.length === 0 && !projectsLoading ? (
                  <p className="cabina-projects__hint">Aun no has publicado proyectos.</p>
                ) : (
                  ["imagen", "video", "animacion", "interactivo", "otro"].map((category) => {
                    const items = projects.filter((project) => (project.type ?? "otro") === category);
                    if (!items.length) {
                      return null;
                    }
                    return (
                      <div key={category} className="cabina-projects__category">
                        <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className="cabina-projects__grid">
                          {items.map((project) => (
                            <article
                              key={project.id}
                              className="cabina-projects__card"
                              onClick={() => {
                                setSelectedProject(project);
                              }}
                            >
                              <div className="cabina-projects__media">
                                {project.type === "video" ? (
                                  <video src={project.media_url ?? ""} muted playsInline />
                                ) : (
                                  <img src={project.media_url ?? ""} alt={project.title ?? "Proyecto"} />
                                )}
                              </div>
                              <div className="cabina-projects__meta">
                                <h5>{project.title ?? "Proyecto sin titulo"}</h5>
                                <p>{project.description ?? "Sin descripcion"}</p>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            ) : null}
            {selectedProject ? (
              <div className="cabina-projects__overlay" onClick={() => setSelectedProject(null)}>
                <div className="cabina-projects__drawer" onClick={(event) => event.stopPropagation()}>
                  <div className="cabina-projects__drawer-head">
                    <div>
                      <h3>{selectedProject.title ?? "Proyecto"}</h3>
                      <p>{selectedProject.description ?? "Sin descripcion"}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedProject(null)}>
                      Cerrar
                    </button>
                  </div>
                  {isOwner ? (
                    <div className="cabina-projects__edit">
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
                      {editMessage ? <p className="cabina-settings__message">{editMessage}</p> : null}
                      <button
                        type="button"
                        className="cabina-dashboard__action"
                        disabled={editSaving}
                        onClick={async () => {
                          if (!supabase || !sessionId || !selectedProject) {
                            setEditMessage("Inicia sesion para editar.");
                            return;
                          }
                          setEditSaving(true);
                          setEditMessage(null);
                          const { data, error } = await supabase
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
                          if (!data || data.length === 0) {
                            setEditMessage("No se pudo guardar. Verifica permisos.");
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
                    </div>
                  ) : null}
                  <div className="cabina-projects__stats">
                    <div>
                      <span>Likes</span>
                      <strong>0</strong>
                    </div>
                    <div>
                      <span>Vistas</span>
                      <strong>0</strong>
                    </div>
                    <div>
                      <span>Compartidos</span>
                      <strong>0</strong>
                    </div>
                  </div>
                  <div className="cabina-projects__share">
                    <span>Link publico</span>
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/visuales/proyecto/${
                        selectedProject.id
                      }`}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {activeSection === "personalizar" ? (
              <section className="cabina-settings">
                <div className="cabina-settings__card">
                  <div className="cabina-settings__header">
                    <h3>Ajustes de la cuenta</h3>
                    <p>Actualiza tu logo, nombre y datos del estudio.</p>
                  </div>
                  <div className="cabina-settings__grid">
                    <label className="cabina-settings__field">
                      <span>Logo</span>
                      <div className="cabina-settings__logo">
                        <div className="cabina-settings__logo-preview visuales-avatar visuales-avatar--square">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo del estudio" />
                          ) : (
                            <span>{avatarInitial}</span>
                          )}
                        </div>
                        <label className="cabina-settings__logo-action">
                          Subir logo
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!isOwner}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }
                              if (logoPreview) {
                                URL.revokeObjectURL(logoPreview);
                              }
                              const nextUrl = URL.createObjectURL(file);
                              setLogoPreview(nextUrl);
                            }}
                          />
                        </label>
                      </div>
                    </label>
                    <label className="cabina-settings__field">
                      <span>Nombre completo</span>
                      <input
                        type="text"
                        value={settingsName}
                        onChange={(event) => setSettingsName(event.target.value)}
                        disabled={!isOwner}
                      />
                    </label>
                    <label className="cabina-settings__field">
                      <span>Nombre de usuario</span>
                      <input
                        type="text"
                        value={settingsUsername}
                        onChange={(event) => {
                          const nextValue = event.target.value.replace(/\s+/g, "").toLowerCase();
                          setSettingsUsername(nextValue);
                        }}
                        disabled={!isOwner}
                      />
                    </label>
                    <label className="cabina-settings__field cabina-settings__field--full">
                      <span>Bio</span>
                      <textarea
                        rows={4}
                        placeholder="Cuenta tu historia creativa..."
                        value={settingsBio}
                        onChange={(event) => setSettingsBio(event.target.value)}
                        disabled={!isOwner}
                      />
                    </label>
                  </div>
                  {settingsMessage ? <p className="cabina-settings__message">{settingsMessage}</p> : null}
                  {!isOwner ? (
                    <p className="cabina-settings__message">Estas viendo un estudio ajeno.</p>
                  ) : null}
                  <button
                    type="button"
                    className="cabina-dashboard__action"
                    onClick={handleSaveSettings}
                    disabled={!isOwner || settingsBusy}
                  >
                    {settingsBusy ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </section>
            ) : null}
            {activeSection === "preferencias" ? (
              <section className="cabina-settings">
                <div className="cabina-settings__card">
                  <div className="cabina-settings__header">
                    <h3>Preferencias</h3>
                    <p>Opciones generales del estudio.</p>
                  </div>
                  <div className="cabina-projects-empty">
                    <p>Pronto podras configurar notificaciones y privacidad.</p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
