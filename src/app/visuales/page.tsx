"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../components/site-shell";
import { supabase } from "../lib/supabase";

export default function VisualesHubPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<string | null | undefined>(undefined);
  const [username, setUsername] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      return sessionStorage.getItem("visuales-username");
    } catch {
      return null;
    }
  });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("imagen");
  const [file, setFile] = useState<File | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarInitial, setAvatarInitial] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }
    try {
      const stored = sessionStorage.getItem("visuales-avatar");
      if (stored) {
        return stored;
      }
      const storedUsername = sessionStorage.getItem("visuales-username");
      return storedUsername ? storedUsername.slice(0, 1).toUpperCase() : "";
    } catch {
      return "";
    }
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const resolvedInitial = (() => {
    if (username) {
      return username.slice(0, 1).toUpperCase();
    }
    if (sessionUser === null) {
      return "G";
    }
    if (avatarInitial) {
      return avatarInitial.slice(0, 1).toUpperCase();
    }
    return "U";
  })();

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setSessionUser(user?.id ?? null);
      if (user) {
        const metaUsername = (user.user_metadata?.username as string | undefined)?.trim();
        if (metaUsername) {
          setUsername(metaUsername);
          const nextInitial = metaUsername.slice(0, 1).toUpperCase();
          setAvatarInitial(nextInitial);
          try {
            sessionStorage.setItem("visuales-username", metaUsername);
            sessionStorage.setItem("visuales-avatar", nextInitial);
          } catch {
            // ignore
          }
        } else if (!username) {
          const emailInitial = user.email?.slice(0, 1)?.toUpperCase();
          if (emailInitial && !avatarInitial) {
            setAvatarInitial(emailInitial);
            try {
              sessionStorage.setItem("visuales-avatar", emailInitial);
            } catch {
              // ignore
            }
          }
        }
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSessionUser(user?.id ?? null);
      if (user) {
        const metaUsername = (user.user_metadata?.username as string | undefined)?.trim();
        if (metaUsername) {
          setUsername(metaUsername);
          const nextInitial = metaUsername.slice(0, 1).toUpperCase();
          setAvatarInitial(nextInitial);
          try {
            sessionStorage.setItem("visuales-username", metaUsername);
            sessionStorage.setItem("visuales-avatar", nextInitial);
          } catch {
            // ignore
          }
        } else if (!username) {
          const emailInitial = user.email?.slice(0, 1)?.toUpperCase();
          if (emailInitial && !avatarInitial) {
            setAvatarInitial(emailInitial);
            try {
              sessionStorage.setItem("visuales-avatar", emailInitial);
            } catch {
              // ignore
            }
          }
        }
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || sessionUser === undefined) {
      return;
    }
    if (!sessionUser) {
      setUsername(null);
      return;
    }
    let isActive = true;
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", sessionUser)
      .single()
      .then(({ data }) => {
        if (!isActive) {
          return;
        }
        const nextUsername = data?.username ?? null;
        const nextDisplayName = data?.display_name ?? null;
        setUsername(nextUsername);
        setDisplayName(nextDisplayName);
        if (nextUsername) {
          try {
            sessionStorage.setItem("visuales-username", nextUsername);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setUsername(null);
        setDisplayName(null);
      });
    return () => {
      isActive = false;
    };
  }, [sessionUser]);

  useEffect(() => {
    if (username) {
      const nextInitial = username.slice(0, 1).toUpperCase();
      setAvatarInitial(nextInitial);
      try {
        sessionStorage.setItem("visuales-avatar", nextInitial);
      } catch {
        // ignore
      }
      return;
    }
    if (sessionUser === null) {
      setAvatarInitial("G");
      try {
        sessionStorage.setItem("visuales-avatar", "G");
      } catch {
        // ignore
      }
    }
  }, [username, sessionUser]);

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
          <input type="search" placeholder="Buscar proyectos, creadores, tags..." />
        </div>
        <div className="hub-topbar__actions">
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
              <span suppressHydrationWarning>{resolvedInitial}</span>
            </button>
            {menuOpen ? (
              <div className="hub-account-menu__panel">
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
        <div className="hub-logo">
          <span>Visuales</span>
        </div>
        <nav className="hub-nav">
          <Link href="/visuales">Inicio</Link>
          <button type="button" className="active">
            Visuales Hub
          </button>
          <button type="button">Explorar</button>
          <button type="button">Cabinas</button>
          <button type="button">Suscripciones</button>
          <button type="button">Directos</button>
          <button type="button">Historial</button>
        </nav>
        <div className="hub-types">
          <p>Tipos de contenido</p>
          <div className="hub-chip-row">
            <span>Imagen</span>
            <span>Video</span>
            <span>Animacion</span>
            <span>Interactivo</span>
          </div>
        </div>
      </aside>

      <main className="hub-main">
        <header className="hub-header">
          <div>
            <p className="hub-eyebrow">Mesa de trabajo</p>
            <h1>Explora el universo Visuales</h1>
            <p>Descubre proyectos, recorre cabinas creativas y conecta con creadores cuando quieras dar el siguiente paso.</p>
          </div>
        </header>
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
        <section className="hub-creators">
          <div className="hub-section__header">
            <h2>Cabinas de creadores</h2>
          </div>
          <div className="hub-feed__empty">
            <p>No hay creadores activos aun.</p>
          </div>
        </section>
        <section className="hub-feed">
          <div className="hub-section__header">
            <h2>Proyectos recientes</h2>
          </div>
          <div className="hub-feed__empty">
            <p>No hay proyectos publicados aun.</p>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
