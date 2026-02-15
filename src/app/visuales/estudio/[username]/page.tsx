/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SiteShell from "../../../components/site-shell";
import {
  fetchProjectStatsMap,
  formatCompactMetric,
  formatWatchHours,
  getProjectStats,
  recordProjectShare,
  type ProjectStats,
} from "../../../lib/project-stats";
import { supabase } from "../../../lib/supabase";

export default function VisualesEstudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studioIntent = searchParams.get("intent");
  const params = useParams<{ username: string | string[] }>();
  const routeUsername = params?.username;
  const username = Array.isArray(routeUsername) ? routeUsername[0] : routeUsername;
  const resolvedUsername = username ?? "";
  const studioName = decodeURIComponent(resolvedUsername);
  const normalizeSlug = (value: string) => value.trim().replace(/^@/, "").toLowerCase();
  const avatarInitial = studioName.replace(/^@/, "").slice(0, 1).toUpperCase() || "U";

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      setIsGuest(sessionStorage.getItem("visuales-guest") === "1");
    } catch {
      setIsGuest(false);
    }
    const normalized = studioName.replace(/^@+/, "").trim();
    if (!normalized) {
      return;
    }
    const initial = normalized.slice(0, 1).toUpperCase();
    try {
      sessionStorage.setItem("visuales-username", normalized);
      sessionStorage.setItem("visuales-avatar", initial);
      localStorage.setItem("visuales-username", normalized);
      localStorage.setItem("visuales-avatar", initial);
      localStorage.setItem("visuales-avatar-letter", initial);
    } catch {
      // ignore
    }
  }, [studioName]);
  const [activeSection, setActiveSection] = useState<
    "subidas" | "proyectos" | "pagos" | "acuerdos" | "preferencias" | "personalizar"
  >("subidas");
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null | undefined>(undefined);
  const [isGuest, setIsGuest] = useState(false);
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
  const [projectStatsMap, setProjectStatsMap] = useState<Record<string, ProjectStats>>({});
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
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const projectPanelRef = useRef<HTMLDivElement | null>(null);
  const lastStatsKeyRef = useRef<string>("");
  const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement | null>(null);
  const sectionCopy = useMemo(
    () => ({
      subidas: {
        title: "Subidas",
        subtitle: "Carga y publica nuevos proyectos.",
        empty: "Sube tu primer proyecto para que aparezca aqui.",
      },
      proyectos: {
        title: null,
        subtitle: null,
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
  const selectedProjectStats = selectedProject ? getProjectStats(projectStatsMap, selectedProject.id) : null;

  const normalizedSlug = normalizeSlug(studioName);
  const loadOwnedProjects = useCallback(async () => {
    if (!supabase || !sessionId || !isOwner) {
      setProjects([]);
      setProjectStatsMap({});
      setProjectsLoading(false);
      return;
    }
    setProjectsLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, description, type, media_url, created_at")
      .eq("user_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) {
      setProjects([]);
      setProjectStatsMap({});
      setProjectsLoading(false);
      return;
    }
    setProjects((data as typeof projects) ?? []);
    setProjectsLoading(false);
  }, [isOwner, sessionId]);

  useEffect(() => {
    if (!menuOpen && !uploadMenuOpen) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
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
    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen, uploadMenuOpen]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const client = supabase;
    client.auth.getSession().then(({ data }) => {
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
      if (!userId) {
        return;
      }
      client
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
    if (sessionId === null && !isGuest) {
      setIsOwner(false);
      router.replace("/visuales/auth");
    }
  }, [router, sessionId, isGuest]);

  useEffect(() => {
    loadOwnedProjects();
  }, [loadOwnedProjects]);

  useEffect(() => {
    let active = true;
    const projectIds = projects.map((project) => project.id).filter(Boolean);
    if (projectIds.length === 0) {
      lastStatsKeyRef.current = "";
      setProjectStatsMap({});
      return;
    }
    const statsKey = projectIds.join(",");
    if (lastStatsKeyRef.current === statsKey) {
      return;
    }
    lastStatsKeyRef.current = statsKey;
    fetchProjectStatsMap(projectIds).then((stats) => {
      if (!active) {
        return;
      }
      setProjectStatsMap(stats);
    });
    return () => {
      active = false;
    };
  }, [projects]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    setEditTitle(selectedProject.title ?? "");
    setEditDescription(selectedProject.description ?? "");
    setEditType((selectedProject.type ?? "imagen").toLowerCase());
    setEditMessage(null);
    setDeleteCandidateId(null);
    setLinkCopied(false);
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, [selectedProject]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (!projectPanelRef.current || !event.target) {
        return;
      }
      if (!projectPanelRef.current.contains(event.target as Node)) {
        setSelectedProject(null);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
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
      const lastUpdate = new Date(usernameUpdatedAt);
      if (!Number.isNaN(lastUpdate.getTime())) {
        const nextAllowed = new Date(lastUpdate.getTime());
        nextAllowed.setDate(nextAllowed.getDate() + 30);
        if (Date.now() < nextAllowed.getTime()) {
          setSettingsMessage("Solo puedes cambiar tu usuario una vez al mes.");
          return;
        }
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
      try {
        sessionStorage.setItem("visuales-username", normalizedUser);
        sessionStorage.setItem("visuales-avatar", normalizedUser.slice(0, 1).toUpperCase());
        localStorage.setItem("visuales-username", normalizedUser);
        localStorage.setItem("visuales-avatar", normalizedUser.slice(0, 1).toUpperCase());
        localStorage.setItem("visuales-avatar-letter", normalizedUser.slice(0, 1).toUpperCase());
      } catch {
        // ignore
      }
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
        await loadOwnedProjects();
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!studioIntent) {
      return;
    }
    if (studioIntent === "upload" || studioIntent === "publish") {
      setActiveSection("subidas");
    }
    if (studioIntent === "upload" && isOwner) {
      window.requestAnimationFrame(() => handlePickFile());
    }
  }, [isOwner, studioIntent]);

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
      router.push("/visuales");
      return;
    }
    await supabase.auth.signOut();
    router.push("/visuales");
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
          <input type="search" placeholder="Buscar en tu estudio..." aria-label="Buscar en tu estudio" />
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
                    setActiveSection("subidas");
                    window.requestAnimationFrame(() => handlePickFile());
                  }}
                >
                  Subir archivo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    setActiveSection("subidas");
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
              aria-label="Abrir menu de cuenta"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setUploadMenuOpen(false);
              }}
            >
              <span>{avatarInitial}</span>
            </button>
            {menuOpen ? (
              <div className="hub-account-menu__panel">
                <div className="hub-account-menu__status">Estado sesion: {isGuest ? "Invitado" : "Activa"}</div>
                <div className="hub-account-menu__profile">
                  <div className="hub-account-menu__name">{settingsName || studioName.replace(/^@/, "")}</div>
                  <div className="hub-account-menu__handle">@{normalizeSlug(studioName)}</div>
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
      </div>
      <main className="cabina-dashboard">
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
            {currentSection.title || currentSection.subtitle ? (
              <div className="cabina-dashboard__section-head">
                {currentSection.title || currentSection.subtitle ? (
                  <div>
                    {currentSection.title ? <h2>{currentSection.title}</h2> : null}
                    {currentSection.subtitle ? <p>{currentSection.subtitle}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
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
            ) : null}
            {activeSection !== "subidas" &&
            activeSection !== "proyectos" &&
            activeSection !== "personalizar" &&
            activeSection !== "preferencias" ? (
              <div className="cabina-projects-empty">
                <p>{currentSection.empty}</p>
              </div>
            ) : null}
            {activeSection === "proyectos" ? (
              <section className="cabina-projects__list">
                <div className="cabina-projects__header">
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
                              onClick={() => setSelectedProject(project)}
                            >
                              <button
                                type="button"
                                className="cabina-projects__card-hitbox"
                                aria-label="Abrir detalles del proyecto"
                                onClick={() => setSelectedProject(project)}
                              />
                              <div className="cabina-projects__media" onClick={() => setSelectedProject(project)}>
                                {project.type === "video" ? (
                                  <video src={project.media_url ?? ""} muted playsInline />
                                ) : (
                                  <img src={project.media_url ?? ""} alt={project.title ?? "Proyecto"} />
                                )}
                              </div>
                              <div className="cabina-projects__meta" onClick={() => setSelectedProject(project)}>
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
                <div className="cabina-projects__drawer" ref={projectPanelRef} onClick={(event) => event.stopPropagation()}>
                  <div className="cabina-projects__drawer-head">
                    <div>
                      <h3>{selectedProject.title ?? "Proyecto"}</h3>
                      <p>{selectedProject.description ?? "Sin descripcion"}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedProject(null)}>
                      Cerrar
                    </button>
                  </div>
                  <div className="cabina-projects__preview">
                    {selectedProject.type === "video" ? (
                      <video src={selectedProject.media_url ?? ""} controls playsInline />
                    ) : (
                      <img src={selectedProject.media_url ?? ""} alt={selectedProject.title ?? "Proyecto"} />
                    )}
                  </div>
                  {isOwner ? (
                    <div className="cabina-projects__edit">
                      <div className="cabina-projects__edit-preview">
                        <span>Vista previa</span>
                        {selectedProject.type === "video" ? (
                          <video src={selectedProject.media_url ?? ""} controls playsInline />
                        ) : (
                          <img src={selectedProject.media_url ?? ""} alt={selectedProject.title ?? "Proyecto"} />
                        )}
                        <button
                          type="button"
                          className="cabina-projects__open"
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
                      {editMessage ? <p className="cabina-settings__message">{editMessage}</p> : null}
                      <button
                        type="button"
                        className="cabina-dashboard__action"
                        disabled={editSaving || deleteBusy}
                        onClick={async () => {
                          if (!supabase || !sessionId || !selectedProject) {
                            setEditMessage("Inicia sesion para editar.");
                            return;
                          }
                          setEditSaving(true);
                          setEditMessage(null);
                          const { error } = await supabase
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
                        className="cabina-dashboard__action cabina-dashboard__action--ghost"
                        disabled={editSaving || deleteBusy}
                        onClick={() => {
                          if (!selectedProject) {
                            return;
                          }
                          setEditMessage(null);
                          setDeleteCandidateId(selectedProject.id);
                        }}
                      >
                        Eliminar proyecto
                      </button>
                      {deleteCandidateId === selectedProject.id ? (
                        <div className="cabina-settings__message">
                          Vas a eliminar este proyecto definitivamente.
                          <div className="cabina-projects__actions">
                            <button
                              type="button"
                              className="cabina-dashboard__action"
                              disabled={deleteBusy || editSaving}
                              onClick={async () => {
                                if (!supabase || !sessionId || !selectedProject) {
                                  setEditMessage("Inicia sesion para editar.");
                                  return;
                                }
                                setDeleteBusy(true);
                                setEditMessage(null);
                                try {
                                  const mediaUrl = selectedProject.media_url ?? "";
                                  if (mediaUrl.includes("/storage/v1/object/public/projects/")) {
                                    const [, path] = mediaUrl.split("/storage/v1/object/public/projects/");
                                    if (path) {
                                      const { error: storageError } = await supabase.storage.from("projects").remove([path]);
                                      if (storageError) {
                                        setEditMessage(storageError.message);
                                      }
                                    }
                                  }
                                  const { error } = await supabase
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
                              className="cabina-dashboard__action cabina-dashboard__action--ghost"
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
                  <div className="cabina-projects__actions">
                    <button
                      type="button"
                      className="cabina-dashboard__action cabina-dashboard__action--ghost"
                      onClick={() => {
                        const base = typeof window !== "undefined" ? window.location.origin : "";
                        window.open(`${base}/visuales/proyecto/${selectedProject.id}`, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Ver pagina del proyecto
                    </button>
                  </div>
                  <div className="cabina-projects__stats">
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
                  <div className="cabina-projects__share">
                    <span>Link publico</span>
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/visuales/proyecto/${
                        selectedProject.id
                      }`}
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
                    <span className={`cabina-projects__share-hint${linkCopied ? " is-visible" : ""}`}>
                      Link copiado
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            {activeSection === "personalizar" ? (
              <section className="cabina-settings" id="ajustes">
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
                  <p className="cabina-projects__hint">Configura tus preferencias cuando quieras.</p>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
