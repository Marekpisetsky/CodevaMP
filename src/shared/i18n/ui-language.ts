"use client";

import { useEffect, useState } from "react";

export type UiLanguage = "es" | "en";

const UI_LANG_STORAGE_KEY = "codevamp:ui-lang";

function sanitizeLanguage(value: string | null | undefined): UiLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "es" || normalized === "en") {
    return normalized;
  }
  return null;
}

function readInitialLanguage(): UiLanguage {
  const fromEnv = sanitizeLanguage(process.env.NEXT_PUBLIC_UI_LANG);
  return fromEnv ?? "es";
}

export function useUiLanguage() {
  const [language, setLanguage] = useState<UiLanguage>(readInitialLanguage);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fromQuery = sanitizeLanguage(params.get("lang"));
    if (fromQuery) {
      window.localStorage.setItem(UI_LANG_STORAGE_KEY, fromQuery);
      setLanguage(fromQuery);
      return;
    }

    const fromStorage = sanitizeLanguage(window.localStorage.getItem(UI_LANG_STORAGE_KEY));
    if (fromStorage) {
      setLanguage(fromStorage);
      return;
    }

    window.localStorage.setItem(UI_LANG_STORAGE_KEY, language);
  }, [language]);

  const setUiLanguage = (next: UiLanguage) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(UI_LANG_STORAGE_KEY, next);
    }
    setLanguage(next);
  };

  return { language, setUiLanguage };
}
