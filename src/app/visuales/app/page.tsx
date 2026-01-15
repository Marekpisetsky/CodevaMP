"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../../components/site-shell";
import { supabase } from "../../lib/supabase";

export default function VisualesHubPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("imagen");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessionUser(data.session?.user.id ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user.id ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const canUpload = Boolean(sessionUser);


  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    router.push("/visuales/auth");
  };

  const handleRequireAuth = () => {
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
            <span className="hub-brand__badge">CV</span>
            <span className="hub-brand__text">
              <span className="hub-brand__title">CodevaMP Studio</span>
              <span className="hub-brand__subtitle">Visuales Hub</span>
            </span>
          </Link>
        </div>
        <div className="hub-search">
          <input type="search" placeholder="Buscar proyectos, creadores, tags..." />
        </div>
        <div className="hub-topbar__actions">
          {sessionUser ? (
            <button type="button" onClick={handleSignOut}>
              Cerrar sesion
            </button>
          ) : (
            <Link href="/visuales/auth">Acceder</Link>
          )}
        </div>
      </div>

      <aside className="hub-sidebar">
        <div className="hub-logo">
          <span>Visuales</span>
        </div>
        <nav className="hub-nav">
          <Link href="/visuales">Inicio</Link>
          <button type="button" className="active">
            Espacio creativo
          </button>
          <button type="button">Explorar</button>
          <button type="button">Suscripciones</button>
          <button type="button">Seguir creadores</button>
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
      </main>

      <aside className="hub-panel">
        <div className="hub-upload">
          <h3>Subir proyecto</h3>
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
        </div>
        <div className="hub-profile">
          <div className="hub-avatar" />
          <div>
            <p className="hub-profile__title">Estado de cuenta</p>
            <p>{sessionUser ? "Conectado" : "Sin sesion"}</p>
          </div>
        </div>
        <div className="hub-creator">
          <h3>Herramientas de creador</h3>
          <p>Administra tu cabina, proyectos y sesiones.</p>
          <button type="button">Configurar cabina</button>
          <button type="button" className="ghost">
            Gestionar proyectos
          </button>
          <button type="button" className="ghost">
            Programar directos
          </button>
        </div>
      </aside>
    </SiteShell>
  );
}
