"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../../components/site-shell";
import { supabase } from "../../lib/supabase";

export default function VisualesAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/visuales/app");
      }
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (!supabase) {
        setMessage("Supabase no esta configurado.");
        return;
      }
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage(error.message);
          return;
        }
        setMessage("Cuenta creada. Revisa tu correo si Supabase pide confirmacion.");
      }
      router.push("/visuales/app");
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = () => {
    try {
      sessionStorage.setItem("visuales-guest", "1");
    } catch {
      // ignore
    }
    router.push("/visuales/app");
  };

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-auth" brandHref="/visuales">
      <section className="visuales-auth__panel">
        <header className="visuales-auth__header">
          <p className="visuales-auth__eyebrow">CodevaMP Visuales</p>
          <h1>{mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h1>
          <p>
            Un espacio profesional para proyectos visuales: cabinas personales, publicaciones y colaboracion creativa.
          </p>
        </header>
        <form className="visuales-auth__form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </label>
          {message ? <p className="visuales-auth__message">{message}</p> : null}
          <button type="submit" disabled={busy}>
            {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
        <div className="visuales-auth__footer">
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "No tienes cuenta? Registrate" : "Ya tienes cuenta? Inicia sesion"}
          </button>
          <button type="button" className="ghost" onClick={handleGuest}>
            Entrar como invitado
          </button>
        </div>
        <p className="visuales-auth__back">
          <Link href="/visuales">Volver a visuales</Link>
        </p>
      </section>
    </SiteShell>
  );
}
