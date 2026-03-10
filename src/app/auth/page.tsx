"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import styles from "./auth-gateway.module.css";

const AUTH_DRAFT_KEY = "codevamp_auth_draft_v1";

export default function AuthGatewayPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}><p style={{ margin: 0 }}>Cargando acceso...</p></section></main>}>
      <AuthGatewayContent />
    </Suspense>
  );
}

function AuthGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { email?: string; password?: string; mode?: "signin" | "signup" };
      if (parsed.email) setEmail(parsed.email);
      if (parsed.password) setPassword(parsed.password);
      if (parsed.mode === "signin" || parsed.mode === "signup") setAuthMode(parsed.mode);
    } catch {
      // ignore invalid draft
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        AUTH_DRAFT_KEY,
        JSON.stringify({
          email,
          password,
          mode: authMode,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [email, password, authMode]);

  useEffect(() => {
    if (!supabase) {
      setSessionUserId(null);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setSessionUserId(data.session?.user.id ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase no esta configurado.");
      return;
    }
    const nextEmail = email.trim();
    if (!nextEmail || !password) {
      setMessage("Completa email y contrasena.");
      return;
    }
    setBusy(true);
    setMessage(null);
    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: nextEmail, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Sesion iniciada.");
        router.replace(returnTo);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email: nextEmail, password });
      setMessage(error ? error.message : "Cuenta creada. Revisa tu email si requiere confirmacion.");
    }
    setBusy(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.layout}>
          <aside className={styles.panel}>
            <div className={styles.brand}>
              <p className={styles.eyebrow}>Acceso general</p>
              <h1 className={styles.title}>CodevaMP Studio</h1>
              <p className={styles.subtitle}>Laboratorio de sistemas interactivos</p>
            </div>
            <p className={styles.subtitle}>
              Inicia sesion y entra a todas las plataformas de CodevaMP con una sola cuenta.
            </p>
          </aside>

          <section className={styles.formPanel}>
            {sessionUserId ? (
              <div className={styles.actions}>
                <Link href="/visuales" className={`${styles.action} ${styles.primary}`}>
                  Entrar a Visuales
                </Link>
                <Link href="/dev" className={`${styles.action} ${styles.secondary}`}>
                  Entrar a Dev
                </Link>
                <Link href={returnTo} className={`${styles.action} ${styles.secondary}`}>
                  Continuar
                </Link>
                <button
                  type="button"
                  className={`${styles.action} ${styles.ghost}`}
                  onClick={async () => {
                    if (!supabase) {
                      return;
                    }
                    await supabase.auth.signOut();
                  }}
                >
                  Cerrar sesion
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.label} htmlFor="auth-email">
                  Correo
                </label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                  autoComplete="email"
                />
                <label className={styles.label} htmlFor="auth-password">
                  Contrasena
                </label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                />
                <div className={styles.actions}>
                  <button type="submit" disabled={busy} className={`${styles.action} ${styles.primary}`}>
                    {busy ? "Procesando..." : authMode === "signin" ? "Iniciar sesion" : "Crear cuenta"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={`${styles.action} ${styles.ghost}`}
                    onClick={() => setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"))}
                  >
                    {authMode === "signin" ? "Crear cuenta" : "Iniciar sesion"}
                  </button>
                </div>
              </form>
            )}
            {message ? <p className={styles.message}>{message}</p> : null}
          </section>
        </div>
      </section>
    </main>
  );
}
