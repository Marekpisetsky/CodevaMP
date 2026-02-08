import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type IdentityState = {
  sessionUser: string | null | undefined;
  username: string | null;
  displayName: string | null;
  emailInitial: string;
  avatarInitial: string;
  storedAvatarLetter: string;
};

const getInitial = (value?: string | null) => {
  const cleaned = (value ?? "").trim().replace(/^@+/, "");
  const match = cleaned.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "";
};

const readStoredAuthInitial = () => {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    const directKey = "sb-wngczsvvounbdwfzntbd-auth-token";
    const key =
      localStorage.getItem(directKey) !== null
        ? directKey
        : Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!key) {
      return "";
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      return "";
    }
    const data = JSON.parse(raw);
    const user =
      data?.currentSession?.user ?? data?.session?.user ?? data?.user ?? data?.currentSession?.user ?? data?.user ?? null;
    const metaUsername =
      (user?.user_metadata?.username as string | undefined)?.trim() ??
      (data?.user?.user_metadata?.username as string | undefined)?.trim();
    if (metaUsername) {
      return getInitial(metaUsername);
    }
    const email =
      (user?.email as string | undefined) ??
      (data?.user?.email as string | undefined) ??
      (data?.currentSession?.user?.email as string | undefined);
    if (email) {
      return getInitial(email.slice(0, 1));
    }
    const token = data?.access_token as string | undefined;
    if (token && token.includes(".")) {
      const payload = token.split(".")[1];
      try {
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(padded));
        const jwtUsername = (decoded?.user_metadata?.username as string | undefined)?.trim();
        if (jwtUsername) {
          return getInitial(jwtUsername);
        }
        const jwtEmail = decoded?.email as string | undefined;
        if (jwtEmail) {
          return getInitial(jwtEmail.slice(0, 1));
        }
      } catch {
        // ignore
      }
    }
    return "";
  } catch {
    return "";
  }
};

const readStoredIdentity = (): Omit<IdentityState, "sessionUser"> => {
  if (typeof window === "undefined") {
    return {
      username: null,
      displayName: null,
      emailInitial: "",
      avatarInitial: "",
      storedAvatarLetter: "",
    };
  }
  try {
    const username = sessionStorage.getItem("visuales-username") ?? localStorage.getItem("visuales-username");
    const displayName =
      sessionStorage.getItem("visuales-display-name") ?? localStorage.getItem("visuales-display-name");
    const emailInitial = localStorage.getItem("visuales-email-initial") ?? "";
    const avatarInitial =
      sessionStorage.getItem("visuales-avatar") ?? localStorage.getItem("visuales-avatar") ?? "";
    const storedAvatarLetter =
      localStorage.getItem("visuales-avatar-letter") ?? getInitial(username ?? displayName ?? emailInitial) ?? "";
    return {
      username: username ?? null,
      displayName: displayName ?? null,
      emailInitial,
      avatarInitial,
      storedAvatarLetter: storedAvatarLetter || readStoredAuthInitial(),
    };
  } catch {
    return {
      username: null,
      displayName: null,
      emailInitial: "",
      avatarInitial: "",
      storedAvatarLetter: "",
    };
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const safeSessionSet = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export function useVisualesIdentity() {
  const [state, setState] = useState<IdentityState>(() => {
    const stored = readStoredIdentity();
    return {
      sessionUser: undefined,
      ...stored,
    };
  });

  const displayAvatarLetter = useMemo(() => {
    return (
      getInitial(state.username ?? state.displayName ?? state.emailInitial ?? state.avatarInitial) ||
      state.storedAvatarLetter ||
      ""
    );
  }, [state.username, state.displayName, state.emailInitial, state.avatarInitial, state.storedAvatarLetter]);

  const persistIdentity = useCallback((next: Partial<IdentityState>) => {
    if (typeof window === "undefined") {
      return;
    }
    if (next.username) {
      safeSessionSet("visuales-username", next.username);
      safeStorageSet("visuales-username", next.username);
    }
    if (next.displayName) {
      safeSessionSet("visuales-display-name", next.displayName);
      safeStorageSet("visuales-display-name", next.displayName);
    }
    if (typeof next.emailInitial === "string" && next.emailInitial) {
      safeStorageSet("visuales-email-initial", next.emailInitial);
    }
    if (typeof next.avatarInitial === "string" && next.avatarInitial) {
      safeSessionSet("visuales-avatar", next.avatarInitial);
      safeStorageSet("visuales-avatar", next.avatarInitial);
    }
    const derivedLetter = getInitial(
      next.username ?? next.displayName ?? next.emailInitial ?? next.avatarInitial ?? ""
    );
    if (derivedLetter) {
      safeStorageSet("visuales-avatar-letter", derivedLetter);
    }
  }, []);

  const applyIdentity = useCallback(
    (next: Partial<IdentityState>) => {
      const filtered = Object.fromEntries(
        Object.entries(next).filter(([, value]) => value !== undefined)
      ) as Partial<IdentityState>;
      if (Object.keys(filtered).length === 0) {
        return;
      }
      setState((prev) => ({
        ...prev,
        ...filtered,
      }));
      persistIdentity(filtered);
    },
    [persistIdentity]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncFromStorage = () => {
      const stored = readStoredIdentity();
      setState((prev) => ({
        ...prev,
        ...stored,
      }));
    };
    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      const user = data.session?.user ?? null;
      setState((prev) => ({ ...prev, sessionUser: user?.id ?? null }));
      if (user) {
        const metaUsername = (user.user_metadata?.username as string | undefined)?.trim() ?? "";
        const emailInit = user.email?.slice(0, 1)?.toUpperCase() ?? "";
        const nextInitial = metaUsername ? getInitial(metaUsername) : emailInit;
        applyIdentity({
          username: metaUsername || undefined,
          emailInitial: emailInit || undefined,
          avatarInitial: nextInitial || undefined,
          storedAvatarLetter: nextInitial || undefined,
        });
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState((prev) => ({ ...prev, sessionUser: user?.id ?? null }));
      if (user) {
        const metaUsername = (user.user_metadata?.username as string | undefined)?.trim() ?? "";
        const emailInit = user.email?.slice(0, 1)?.toUpperCase() ?? "";
        const nextInitial = metaUsername ? getInitial(metaUsername) : emailInit;
        applyIdentity({
          username: metaUsername || undefined,
          emailInitial: emailInit || "",
          avatarInitial: nextInitial,
          storedAvatarLetter: nextInitial || "",
        });
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [applyIdentity]);

  useEffect(() => {
    if (!supabase || !state.sessionUser) {
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", state.sessionUser)
      .single()
      .then(({ data }) => {
        if (!active || !data) {
          return;
        }
        const nextUsername = data.username ?? "";
        const nextDisplay = data.display_name ?? "";
        applyIdentity({
          username: nextUsername || undefined,
          displayName: nextDisplay || undefined,
        });
      });
    return () => {
      active = false;
    };
  }, [applyIdentity, state.sessionUser]);

  useEffect(() => {
    if (!displayAvatarLetter) {
      return;
    }
    if (displayAvatarLetter !== state.storedAvatarLetter) {
      setState((prev) => ({ ...prev, storedAvatarLetter: displayAvatarLetter }));
      safeStorageSet("visuales-avatar-letter", displayAvatarLetter);
    }
  }, [displayAvatarLetter, state.storedAvatarLetter]);

  return {
    sessionUser: state.sessionUser,
    username: state.username,
    displayName: state.displayName,
    displayAvatarLetter,
    applyIdentity,
  };
}
