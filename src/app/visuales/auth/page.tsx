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
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordHint, setPasswordHint] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const passwordPolicy = {
    minLength: 10,
    uppercase: /[A-Z]/,
    number: /\d/,
    symbol: /[^A-Za-z0-9]/,
  };

  const getPasswordIssues = (value: string) => {
    const issues: string[] = [];
    if (value.length < passwordPolicy.minLength) {
      issues.push(`Minimo ${passwordPolicy.minLength} caracteres.`);
    }
    if (!passwordPolicy.uppercase.test(value)) {
      issues.push("Incluye una mayuscula.");
    }
    if (!passwordPolicy.number.test(value)) {
      issues.push("Incluye un numero.");
    }
    if (!passwordPolicy.symbol.test(value)) {
      issues.push("Incluye un simbolo.");
    }
    return issues;
  };

  const normalizeUsername = (value: string) => value.trim().toLowerCase();
  const normalizeDisplayName = (value: string) => value.trim();

  const isValidUsername = (value: string) => {
    const normalized = normalizeUsername(value);
    if (normalized.length < 3) {
      return false;
    }
    return /^[a-z0-9-_]+$/.test(normalized);
  };

  const isValidDisplayName = (value: string) => {
    const normalized = normalizeDisplayName(value);
    return normalized.length >= 2 && normalized.length <= 40;
  };

  const blockedWords = [
    "puta",
    "puto",
    "mierda",
    "verga",
    "polla",
    "cono",
    "culo",
    "porno",
    "porn",
    "sex",
    "sexy",
    "nazi",
    "hitler",
    "racist",
    "racismo",
  ];

  const normalizeForFilter = (value: string) =>
    value
      .toLowerCase()
      .replace(/[0]/g, "o")
      .replace(/[1]/g, "i")
      .replace(/[3]/g, "e")
      .replace(/[4]/g, "a")
      .replace(/[5]/g, "s")
      .replace(/[7]/g, "t")
      .replace(/[@]/g, "a");

  const hasBlockedWord = (value: string) => {
    const normalized = normalizeForFilter(value);
    return blockedWords.some((word) => normalized.includes(word));
  };

  const parseBirthdate = (value: string) => {
    const trimmed = value.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return null;
    }
    const [day, month, year] = trimmed.split("/").map((part) => Number.parseInt(part, 10));
    if (!day || !month || !year) {
      return null;
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return null;
    }
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (date.getTime() > todayUtc) {
      return null;
    }
    return date;
  };

  const isUsernameAvailable = async (candidate: string, excludeId?: string | null) => {
    if (!supabase) {
      return false;
    }
    const query = supabase.from("profiles").select("id").eq("username", candidate).limit(1);
    const { data, error } = excludeId ? await query.neq("id", excludeId) : await query;
    if (error) {
      return false;
    }
    return !data || data.length === 0;
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const userId = data.session.user.id;
        setSessionId(userId);
        if (!supabase) {
          return;
        }
        supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single()
          .then(({ data: profile }) => {
            if (profile?.username) {
              router.replace("/visuales/app");
              return;
            }
            setNeedsUsername(true);
          })
          .catch(() => {
            setNeedsUsername(true);
          });
        return;
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
        const issues = getPasswordIssues(password);
        if (issues.length > 0) {
          const hint = `Password debil: ${issues.join(" ")}`;
          setMessage(hint);
          setPasswordHint(hint);
          console.warn("Password policy rejected", { email, issues });
          return;
        }
        const normalizedUsername = normalizeUsername(username);
        const normalizedDisplayName = normalizeDisplayName(displayName);
        const parsedBirthdate = parseBirthdate(birthdate);
        if (!isValidUsername(normalizedUsername)) {
          setMessage("Usuario invalido. Usa 3+ caracteres, sin espacios, solo letras, numeros, - o _.");
          return;
        }
        if (!isValidDisplayName(normalizedDisplayName)) {
          setMessage("Nombre invalido. Usa entre 2 y 40 caracteres.");
          return;
        }
        if (hasBlockedWord(normalizedDisplayName)) {
          setMessage("Nombre invalido. Usa un nombre apropiado.");
          return;
        }
        if (!parsedBirthdate) {
          setMessage("Fecha invalida. Usa dd/mm/aaaa y solo fechas pasadas o hoy.");
          return;
        }
        const isAvailable = await isUsernameAvailable(normalizedUsername);
        if (!isAvailable) {
          setMessage("Ese usuario ya esta en uso. Elige otro.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: normalizedUsername,
              display_name: normalizedDisplayName,
              birthdate: parsedBirthdate.toISOString().slice(0, 10),
              username_updated_at: new Date().toISOString(),
            },
          },
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        if (data.user?.id) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: data.user.id,
                username: normalizedUsername,
                display_name: normalizedDisplayName,
                birthdate: parsedBirthdate.toISOString().slice(0, 10),
                username_updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          if (profileError) {
            setMessage(profileError.message);
            return;
          }
        }
        setMessage("Cuenta creada. Revisa tu correo si Supabase pide confirmacion.");
      }
      router.push("/visuales/app");
    } finally {
      setBusy(false);
    }
  };

  const handleUsernameSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !sessionId) {
      return;
    }
    const normalizedUsername = normalizeUsername(username);
    const normalizedDisplayName = normalizeDisplayName(displayName);
    const parsedBirthdate = parseBirthdate(birthdate);
    if (!isValidUsername(normalizedUsername)) {
      setMessage("Usuario invalido. Usa 3+ caracteres, sin espacios, solo letras, numeros, - o _.");
      return;
    }
    if (!isValidDisplayName(normalizedDisplayName)) {
      setMessage("Nombre invalido. Usa entre 2 y 40 caracteres.");
      return;
    }
    if (hasBlockedWord(normalizedDisplayName)) {
      setMessage("Nombre invalido. Usa un nombre apropiado.");
      return;
    }
    if (!parsedBirthdate) {
      setMessage("Fecha invalida. Usa dd/mm/aaaa y solo fechas pasadas o hoy.");
      return;
    }
    const isAvailable = await isUsernameAvailable(normalizedUsername, sessionId);
    if (!isAvailable) {
      setMessage("Ese usuario ya esta en uso. Elige otro.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: sessionId,
            username: normalizedUsername,
            display_name: normalizedDisplayName,
            birthdate: parsedBirthdate.toISOString().slice(0, 10),
            username_updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (error) {
        setMessage(error.message);
        return;
      }
      setNeedsUsername(false);
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
          <h1>{needsUsername ? "Completar usuario" : mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h1>
          <p>
            Un espacio profesional para proyectos visuales: cabinas personales, publicaciones y colaboracion creativa.
          </p>
        </header>
        {needsUsername ? (
          <form className="visuales-auth__form" onSubmit={handleUsernameSave}>
            <label>
              Usuario (@)
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="tu-nombre"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Nombre completo
              <input
                type="text"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Tu nombre"
                required
              />
            </label>
            <label>
              Fecha de nacimiento
              <input
                type="text"
                name="birthdate"
                value={birthdate}
                onChange={(event) => setBirthdate(event.target.value)}
                placeholder="dd/mm/aaaa"
                required
              />
            </label>
            {message ? <p className="visuales-auth__message">{message}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Procesando..." : "Guardar usuario"}
            </button>
          </form>
        ) : (
          <>
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
              {mode === "signup" ? (
                <label>
                  Usuario (@)
                  <input
                    type="text"
                    name="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="tu-nombre"
                    autoComplete="username"
                    required
                  />
                </label>
              ) : null}
              {mode === "signup" ? (
                <label>
                  Nombre completo
                  <input
                    type="text"
                    name="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </label>
              ) : null}
              {mode === "signup" ? (
                <label>
                  Fecha de nacimiento
                  <input
                    type="text"
                    name="birthdate"
                    value={birthdate}
                    onChange={(event) => setBirthdate(event.target.value)}
                    placeholder="dd/mm/aaaa"
                    required
                  />
                </label>
              ) : null}
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPassword(nextValue);
                    if (mode === "signup") {
                      const issues = getPasswordIssues(nextValue);
                      setPasswordHint(issues.length ? `Requisitos: ${issues.join(" ")}` : null);
                    } else {
                      setPasswordHint(null);
                    }
                  }}
                  required
                  minLength={passwordPolicy.minLength}
                />
              </label>
              {mode === "signup" ? (
                <p className="visuales-auth__hint">
                  Requisitos: minimo {passwordPolicy.minLength} caracteres, 1 mayuscula, 1 numero y 1 simbolo.
                </p>
              ) : null}
              {passwordHint ? <p className="visuales-auth__hint">{passwordHint}</p> : null}
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
          </>
        )}
        <p className="visuales-auth__back">
          <Link href="/visuales">Volver a visuales</Link>
        </p>
      </section>
    </SiteShell>
  );
}

