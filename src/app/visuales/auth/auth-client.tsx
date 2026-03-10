"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteShell from "../../components/site-shell";
import { supabase } from "../../lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export default function VisualesAuthClient() {
  const router = useRouter();
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo = returnTo && returnTo.startsWith("/visuales") ? returnTo : null;
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
      issues.push(isEs ? `Minimo ${passwordPolicy.minLength} caracteres.` : `Minimum ${passwordPolicy.minLength} characters.`);
    }
    if (!passwordPolicy.uppercase.test(value)) {
      issues.push(tx("Incluye una mayuscula.", "Include one uppercase letter."));
    }
    if (!passwordPolicy.number.test(value)) {
      issues.push(tx("Incluye un numero.", "Include one number."));
    }
    if (!passwordPolicy.symbol.test(value)) {
      issues.push(tx("Incluye un simbolo.", "Include one symbol."));
    }
    return issues;
  };

  const normalizeUsername = (value: string) => value.trim().toLowerCase();
  const normalizeDisplayName = (value: string) => value.trim();
  const formatBirthdate = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    return parts.join("/");
  };
  const suggestUsernameFromEmail = useCallback(
    (value: string) => {
      const local = value.split("@")[0] ?? "";
      const cleaned = local.toLowerCase().replace(/[^a-z0-9-_]/g, "");
      if (cleaned.length >= 3) {
        return cleaned.slice(0, 24);
      }
      return isEs ? "usuario" : "user";
    },
    [isEs]
  );

  const findAvailableUsername = async (base: string) => {
    const normalizedBase = normalizeUsername(base);
    if (!isValidUsername(normalizedBase)) {
      return null;
    }
    const baseAvailable = await isUsernameAvailable(normalizedBase);
    if (baseAvailable) {
      return normalizedBase;
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = Math.floor(100 + Math.random() * 900);
      const candidate = `${normalizedBase}-${suffix}`.slice(0, 24);
      if (!isValidUsername(candidate)) {
        continue;
      }
      const available = await isUsernameAvailable(candidate);
      if (available) {
        return candidate;
      }
    }
    return null;
  };

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
          .then(({ data: profile, error }) => {
            if (profile?.username) {
              router.replace(safeReturnTo ?? "/visuales");
              return;
            }
            if (error) {
              setNeedsUsername(true);
              return;
            }
            setNeedsUsername(true);
          });
        return;
      }
    });
  }, [router, safeReturnTo]);

  useEffect(() => {
    if (mode !== "signup") {
      return;
    }
    if (!email) {
      return;
    }
    setUsername(suggestUsernameFromEmail(email));
  }, [email, mode, suggestUsernameFromEmail]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (!supabase) {
        setMessage(tx("Supabase no esta configurado.", "Supabase is not configured."));
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
          const hint = `${tx("Contrasena debil", "Weak password")}: ${issues.join(" ")}`;
          setMessage(hint);
          setPasswordHint(hint);
          console.warn("Password policy rejected", { email, issues });
          return;
        }
        const precheck = await supabase.auth.signInWithPassword({ email, password });
        if (!precheck.error && precheck.data.session) {
          await supabase.auth.signOut();
          setMessage(tx("Ya existe una cuenta con ese correo.", "An account with this email already exists."));
          return;
        }
        if (precheck.error) {
          const lowered = precheck.error.message.toLowerCase();
          if (!lowered.includes("invalid login") && !lowered.includes("invalid credentials")) {
            setMessage(precheck.error.message);
            return;
          }
        }
        const usernameSeed = username || suggestUsernameFromEmail(email);
        const normalizedUsername = normalizeUsername(usernameSeed);
        const normalizedDisplayName = normalizeDisplayName(displayName);
        const parsedBirthdate = parseBirthdate(birthdate);
        if (!isValidUsername(normalizedUsername)) {
          setMessage(tx("Usuario invalido. Usa 3+ caracteres, sin espacios, solo letras, numeros, - o _.", "Invalid username. Use 3+ characters, no spaces, only letters, numbers, - or _."));
          return;
        }
        if (!isValidDisplayName(normalizedDisplayName)) {
          setMessage(tx("Nombre invalido. Usa entre 2 y 40 caracteres.", "Invalid name. Use 2 to 40 characters."));
          return;
        }
        if (hasBlockedWord(normalizedDisplayName)) {
          setMessage("Nombre invalido. Usa un nombre apropiado.");
          return;
        }
        if (!parsedBirthdate) {
          setMessage(tx("Fecha invalida. Usa dd/mm/aaaa y solo fechas pasadas o hoy.", "Invalid date. Use dd/mm/yyyy and only past dates or today."));
          return;
        }
        const availableUsername = await findAvailableUsername(normalizedUsername);
        if (!availableUsername) {
          setMessage("No se pudo encontrar un usuario disponible. Intenta de nuevo.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: availableUsername,
              display_name: normalizedDisplayName,
              birthdate: parsedBirthdate.toISOString().slice(0, 10),
              username_updated_at: new Date().toISOString(),
            },
          },
        });
        if (error) {
          const lowered = error.message.toLowerCase();
          if (lowered.includes("already registered") || lowered.includes("already exists")) {
            setMessage("Ya existe una cuenta con ese correo.");
          } else {
            setMessage(error.message);
          }
          return;
        }
        if (data.user?.id) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: data.user.id,
                username: availableUsername,
                display_name: normalizedDisplayName,
                birthdate: parsedBirthdate.toISOString().slice(0, 10),
                username_updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
          if (profileError) {
            const lowered = profileError.message.toLowerCase();
            if (lowered.includes("row-level") || lowered.includes("policy")) {
              setMessage("Cuenta creada. Completa tu perfil mas tarde.");
            } else {
              setMessage(profileError.message);
              return;
            }
          }
        }
        setMessage("Cuenta creada. Revisa tu correo si Supabase pide confirmacion.");
      }
      router.push(safeReturnTo ?? "/visuales");
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
      setMessage(tx("Fecha invalida. Usa dd/mm/aaaa y solo fechas pasadas o hoy.", "Invalid date. Use dd/mm/yyyy and only past dates or today."));
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
        const lowered = error.message.toLowerCase();
        if (lowered.includes("row-level") || lowered.includes("policy")) {
          await supabase.auth.updateUser({
            data: {
              username: normalizedUsername,
              display_name: normalizedDisplayName,
              birthdate: parsedBirthdate.toISOString().slice(0, 10),
              username_updated_at: new Date().toISOString(),
            },
          });
        } else {
          setMessage(error.message);
          return;
        }
      }
      setNeedsUsername(false);
      router.push(safeReturnTo ?? "/visuales");
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = () => {
    try {
      sessionStorage.setItem("visuales-guest", "1");
      sessionStorage.removeItem("visuales-guest-id");
      sessionStorage.removeItem("visuales-username");
      sessionStorage.removeItem("visuales-display-name");
      sessionStorage.removeItem("visuales-avatar");
      localStorage.removeItem("visuales-username");
      localStorage.removeItem("visuales-display-name");
      localStorage.removeItem("visuales-avatar");
      localStorage.removeItem("visuales-avatar-letter");
      localStorage.removeItem("visuales-email-initial");
    } catch {
      // ignore
    }
    router.push(safeReturnTo ?? "/visuales");
  };

  return (
    <SiteShell currentPath="/visuales" disableEffects className="visuales-auth" brandHref="/visuales">
      <section className="visuales-auth__panel">
        <header className="visuales-auth__header">
          <p className="visuales-auth__eyebrow">Visuales</p>
          <h1>{needsUsername ? tx("Completar perfil", "Complete profile") : mode === "login" ? tx("Iniciar sesion", "Sign in") : tx("Crear cuenta", "Create account")}</h1>
          <p>{tx("Comparte y explora proyectos visuales.", "Share and explore visual projects.")}</p>
        </header>
        <button type="button" className="visuales-auth__lang" onClick={() => setUiLanguage(language === "es" ? "en" : "es")}>
          {language.toUpperCase()}
        </button>
        {needsUsername ? (
          <form className="visuales-auth__form" onSubmit={handleUsernameSave}>
            <label>
              {tx("Usuario (@)", "Username (@)")}
              <input
                type="text"
                name="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                }}
                placeholder={tx("tu-nombre", "your-name")}
                autoComplete="username"
                required
              />
            </label>
            <label>
              {tx("Nombre completo", "Full name")}
              <input
                type="text"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={tx("Tu nombre", "Your name")}
                required
              />
            </label>
            <label>
              {tx("Fecha de nacimiento", "Birth date")}
              <input
                type="text"
                name="birthdate"
                value={birthdate}
                onChange={(event) => setBirthdate(formatBirthdate(event.target.value))}
                placeholder={tx("dd/mm/aaaa", "dd/mm/yyyy")}
                inputMode="numeric"
                maxLength={10}
                required
              />
            </label>
            {message ? <p className="visuales-auth__message">{message}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? tx("Procesando...", "Processing...") : tx("Guardar usuario", "Save profile")}
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
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  required
                />
              </label>
              {mode === "signup" ? (
                <label>
                  {tx("Nombre completo", "Full name")}
                  <input
                    type="text"
                    name="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={tx("Tu nombre", "Your name")}
                    required
                  />
                </label>
              ) : null}
              {mode === "signup" ? (
                <label>
                  {tx("Fecha de nacimiento", "Birth date")}
                  <input
                    type="text"
                    name="birthdate"
                    value={birthdate}
                    onChange={(event) => setBirthdate(formatBirthdate(event.target.value))}
                    placeholder={tx("dd/mm/aaaa", "dd/mm/yyyy")}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </label>
              ) : null}
              <label>
                {tx("Contrasena", "Password")}
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPassword(nextValue);
                    if (mode === "signup") {
                      const issues = getPasswordIssues(nextValue);
                      setPasswordHint(issues.length ? `${tx("Requisitos", "Requirements")}: ${issues.join(" ")}` : null);
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
                  {tx("Requisitos", "Requirements")}: {tx("minimo", "minimum")} {passwordPolicy.minLength} {tx("caracteres", "characters")}, 1 {tx("mayuscula", "uppercase letter")}, 1 {tx("numero", "number")} {tx("y", "and")} 1 {tx("simbolo", "symbol")}.
                </p>
              ) : null}
              {passwordHint ? <p className="visuales-auth__hint">{passwordHint}</p> : null}
              {message ? <p className="visuales-auth__message">{message}</p> : null}
              <button type="submit" disabled={busy}>
                {busy ? tx("Procesando...", "Processing...") : mode === "login" ? tx("Entrar", "Sign in") : tx("Crear cuenta", "Create account")}
              </button>
            </form>
            <div className="visuales-auth__footer">
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? tx("No tienes cuenta? Registrate", "No account yet? Create one") : tx("Ya tienes cuenta? Inicia sesion", "Already have an account? Sign in")}
              </button>
              <button type="button" className="ghost" onClick={handleGuest}>
                {tx("Entrar como invitado", "Continue as guest")}
              </button>
            </div>
          </>
        )}
        <p className="visuales-auth__back">
          <Link href="/visuales">{tx("Volver a Visuales", "Back to Visuales")}</Link>
        </p>
      </section>
    </SiteShell>
  );
}
