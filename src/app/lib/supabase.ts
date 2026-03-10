"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "");
const normalizeKey = (value: string) => value.trim();

const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const supabaseAnonKey = normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
const devSupabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL_DEV ?? "");
const devSupabaseAnonKey = normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV ?? "");

const usesSameSupabaseProject =
  supabaseUrl &&
  supabaseAnonKey &&
  devSupabaseUrl &&
  devSupabaseAnonKey &&
  supabaseUrl === devSupabaseUrl &&
  supabaseAnonKey === devSupabaseAnonKey;

type GlobalWithSupabaseCache = typeof globalThis & {
  __codevampSupabaseClients?: Map<string, SupabaseClient>;
};

const getClientCache = () => {
  const root = globalThis as GlobalWithSupabaseCache;
  if (!root.__codevampSupabaseClients) {
    root.__codevampSupabaseClients = new Map<string, SupabaseClient>();
  }
  return root.__codevampSupabaseClients;
};

const createBrowserClient = (url: string, key: string, slot: "main" | "dev") => {
  const cacheKey = `${slot}:${url}:${key}`;
  const cache = getClientCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cache.set(cacheKey, client);
  return client;
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey, "main")
    : null;

export const devSupabase =
  usesSameSupabaseProject
    ? supabase
    : devSupabaseUrl && devSupabaseAnonKey
    ? createBrowserClient(devSupabaseUrl, devSupabaseAnonKey, "dev")
    : null;

if (!supabase) {
  console.warn("Supabase env vars missing. Check .env.local or Vercel env vars.");
}

if (!devSupabase) {
  console.warn("Dev Supabase env vars missing. Check NEXT_PUBLIC_SUPABASE_URL_DEV and NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV.");
}
