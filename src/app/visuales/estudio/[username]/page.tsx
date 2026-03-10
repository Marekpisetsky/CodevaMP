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
import { ensureExplorerMembership } from "../../../lib/product-memberships";
import { supabase } from "../../../lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type StudioSection = "subidas" | "proyectos" | "pagos" | "acuerdos" | "preferencias" | "personalizar";
type StudioSort = "newest" | "oldest" | "title-az" | "title-za";
type StudioPreferences = {
  autoplayPreview: boolean;
  compactProjectGrid: boolean;
  reopenLastSection: boolean;
  keyboardShortcuts: boolean;
};
type StudioPayoutMethod = "paypal" | "bank" | "crypto";
type StudioPayoutSettings = {
  method: StudioPayoutMethod;
  destination: string;
  minPayout: number;
};
type StudioTermsAcceptance = {
  accepted: boolean;
  acceptedAt: string | null;
  version: string;
};
type VisualesSubaccount = {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string | null;
};
type StudioNotice = { tone: "ok" | "warn"; text: string } | null;
const resolveMediaUrl = (value: string | null | undefined) => (value ?? "").trim();

const STUDIO_SECTIONS: StudioSection[] = ["subidas", "proyectos", "pagos", "acuerdos", "preferencias", "personalizar"];
const STUDIO_PREFERENCES_KEY = "visuales:studio:preferences:v1";
const STUDIO_LAST_SECTION_KEY = "visuales:studio:last-section";
const STUDIO_PAYOUTS_KEY = "visuales:studio:payouts:v1";
const STUDIO_TERMS_KEY = "visuales:studio:terms:v1";
const STUDIO_MONETIZATION_INTENT_KEY = "visuales:studio:monetization-intent:v1";
const STUDIO_TERMS_VERSION = "v2026-02-18";
const defaultStudioPreferences: StudioPreferences = {
  autoplayPreview: true,
  compactProjectGrid: false,
  reopenLastSection: true,
  keyboardShortcuts: true,
};
const defaultPayoutSettings: StudioPayoutSettings = {
  method: "paypal",
  destination: "",
  minPayout: 25,
};
const defaultTermsAcceptance: StudioTermsAcceptance = {
  accepted: false,
  acceptedAt: null,
  version: STUDIO_TERMS_VERSION,
};

const isStudioSection = (value: string | null): value is StudioSection =>
  !!value && STUDIO_SECTIONS.includes(value as StudioSection);

export default function VisualesEstudioPage() {
  const router = useRouter();
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);
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
  const [activeSection, setActiveSection] = useState<StudioSection>("subidas");
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectSort, setProjectSort] = useState<StudioSort>("newest");
  const [preferences, setPreferences] = useState<StudioPreferences>(defaultStudioPreferences);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [notice, setNotice] = useState<StudioNotice>(null);
  const [payoutSettings, setPayoutSettings] = useState<StudioPayoutSettings>(defaultPayoutSettings);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [termsAcceptance, setTermsAcceptance] = useState<StudioTermsAcceptance>(defaultTermsAcceptance);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsAccepting, setTermsAccepting] = useState(false);
  const [wantsMonetization, setWantsMonetization] = useState(false);
  const [subaccounts, setSubaccounts] = useState<VisualesSubaccount[]>([]);
  const [subaccountsLoading, setSubaccountsLoading] = useState(false);
  const [subaccountBusy, setSubaccountBusy] = useState(false);
  const [subaccountUsername, setSubaccountUsername] = useState("");
  const [subaccountDisplayName, setSubaccountDisplayName] = useState("");
  const [subaccountMessage, setSubaccountMessage] = useState<string | null>(null);
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
        title: isEs ? "Subidas" : "Uploads",
        subtitle: isEs ? "Carga y publica nuevos proyectos." : "Upload and publish new projects.",
        empty: isEs ? "Sube tu primer proyecto para que aparezca aqui." : "Upload your first project to see it here.",
      },
      proyectos: {
        title: null,
        subtitle: null,
        empty: isEs ? "Aun no tienes proyectos publicados." : "You do not have published projects yet.",
      },
      pagos: {
        title: isEs ? "Pagos" : "Payments",
        subtitle: isEs ? "Configura tus pagos y revisa tu historial." : "Configure payouts and review your history.",
        empty: isEs ? "Activa monetizacion para habilitar pagos." : "Enable monetization to unlock payments.",
      },
      acuerdos: {
        title: isEs ? "Contrato" : "Agreement",
        subtitle: isEs ? "Contrato requerido solo para monetizacion." : "Agreement required only for monetization.",
        empty: isEs ? "Activa monetizacion para continuar." : "Enable monetization to continue.",
      },
      preferencias: {
        title: isEs ? "Preferencias" : "Preferences",
        subtitle: isEs ? "Configura notificaciones y comportamiento general." : "Configure notifications and general behavior.",
        empty: isEs ? "No hay preferencias avanzadas disponibles por ahora." : "No advanced preferences available right now.",
      },
      personalizar: {
        title: isEs ? "Personalizar" : "Customize",
        subtitle: isEs ? "Actualiza tu logo, nombre y datos del estudio." : "Update your logo, name and studio profile.",
        empty: isEs ? "Configura tu cuenta y datos del estudio." : "Set your account and studio profile.",
      },
    }),
    [isEs]
  );
  const currentSection = sectionCopy[activeSection];
  const selectedProjectStats = selectedProject ? getProjectStats(projectStatsMap, selectedProject.id) : null;
  const selectedProjectMediaUrl = resolveMediaUrl(selectedProject?.media_url);
  const normalizedProjectSearch = projectSearch.trim().toLowerCase();
  const visibleProjects = useMemo(() => {
    const sorted = [...projects];
    if (projectSort === "oldest") {
      sorted.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    } else if (projectSort === "title-az") {
      sorted.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    } else if (projectSort === "title-za") {
      sorted.sort((a, b) => (b.title ?? "").localeCompare(a.title ?? ""));
    } else {
      sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    }
    if (!normalizedProjectSearch) {
      return sorted;
    }
    return sorted.filter((project) => {
      const candidate = `${project.title ?? ""} ${project.description ?? ""} ${project.type ?? ""}`.toLowerCase();
      return candidate.includes(normalizedProjectSearch);
    });
  }, [normalizedProjectSearch, projectSort, projects]);
  const hasProjectSearch = normalizedProjectSearch.length > 0;
  const payoutRows = useMemo(() => {
    return projects
      .map((project) => {
        const stats = getProjectStats(projectStatsMap, project.id);
        const watchHours = (stats.watch_seconds ?? 0) / 3600;
        const estimate = stats.views_count * 0.004 + stats.likes_count * 0.03 + stats.shares_count * 0.05 + watchHours * 0.015;
        return {
          id: project.id,
          title: project.title ?? "Proyecto",
          views: stats.views_count,
          likes: stats.likes_count,
          shares: stats.shares_count,
          estimate,
        };
      })
      .sort((a, b) => b.estimate - a.estimate);
  }, [projectStatsMap, projects]);
  const payoutSummary = useMemo(() => {
    const gross = payoutRows.reduce((sum, row) => sum + row.estimate, 0);
    const pending = gross * 0.3;
    const available = gross - pending;
    return {
      gross,
      pending,
      available,
    };
  }, [payoutRows]);
  const isTermsAccepted = termsAcceptance.accepted && termsAcceptance.version === STUDIO_TERMS_VERSION;
  const nowMs = Date.now();
  const sixMonthsAgoMs = new Date(new Date().setMonth(new Date().getMonth() - 6)).getTime();
  const recentSubaccountsCount = useMemo(
    () =>
      subaccounts.filter((item) => {
        const createdMs = item.created_at ? new Date(item.created_at).getTime() : nowMs;
        return !Number.isNaN(createdMs) && createdMs >= sixMonthsAgoMs;
      }).length,
    [nowMs, sixMonthsAgoMs, subaccounts]
  );
  const totalSubaccountsLeft = Math.max(0, 10 - subaccounts.length);
  const recentSubaccountsLeft = Math.max(0, 3 - recentSubaccountsCount);

  const normalizedSlug = normalizeSlug(studioName);
  const lastSectionStorageKey = `${STUDIO_LAST_SECTION_KEY}:${normalizedSlug || "unknown"}`;
  const payoutStorageKey = `${STUDIO_PAYOUTS_KEY}:${normalizedSlug || "unknown"}`;
  const termsStorageKey = `${STUDIO_TERMS_KEY}:${sessionId ?? normalizedSlug ?? "unknown"}`;
  const monetizationIntentStorageKey = `${STUDIO_MONETIZATION_INTENT_KEY}:${sessionId ?? normalizedSlug ?? "unknown"}`;
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

  const loadSubaccounts = useCallback(async () => {
    if (!supabase || !sessionId || !isOwner) {
      setSubaccounts([]);
      setSubaccountsLoading(false);
      return;
    }
    setSubaccountsLoading(true);
    const { data, error } = await supabase
      .from("visuales_accounts")
      .select("id, username, display_name, created_at")
      .eq("owner_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) {
      const missingRelation = error.code === "42P01" || /visuales_accounts/i.test(error.message);
      setSubaccountMessage(
        missingRelation
          ? "Falta la tabla visuales_accounts en base de datos."
          : "No se pudieron cargar las subcuentas."
      );
      setSubaccounts([]);
      setSubaccountsLoading(false);
      return;
    }
    setSubaccounts((data as VisualesSubaccount[]) ?? []);
    setSubaccountsLoading(false);
  }, [isOwner, sessionId]);

  const showNotice = useCallback((tone: "ok" | "warn", text: string) => {
    setNotice({ tone, text });
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const loadLocalTermsAcceptance = useCallback((): StudioTermsAcceptance => {
    if (typeof window === "undefined") {
      return defaultTermsAcceptance;
    }
    try {
      const raw = localStorage.getItem(termsStorageKey);
      if (!raw) {
        return defaultTermsAcceptance;
      }
      const parsed = JSON.parse(raw) as Partial<StudioTermsAcceptance>;
      return {
        accepted: !!parsed.accepted,
        acceptedAt: typeof parsed.acceptedAt === "string" ? parsed.acceptedAt : null,
        version: typeof parsed.version === "string" ? parsed.version : STUDIO_TERMS_VERSION,
      };
    } catch {
      return defaultTermsAcceptance;
    }
  }, [termsStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = localStorage.getItem(STUDIO_PREFERENCES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StudioPreferences>;
        setPreferences({
          autoplayPreview:
            typeof parsed.autoplayPreview === "boolean"
              ? parsed.autoplayPreview
              : defaultStudioPreferences.autoplayPreview,
          compactProjectGrid:
            typeof parsed.compactProjectGrid === "boolean"
              ? parsed.compactProjectGrid
              : defaultStudioPreferences.compactProjectGrid,
          reopenLastSection:
            typeof parsed.reopenLastSection === "boolean"
              ? parsed.reopenLastSection
              : defaultStudioPreferences.reopenLastSection,
          keyboardShortcuts:
            typeof parsed.keyboardShortcuts === "boolean"
              ? parsed.keyboardShortcuts
              : defaultStudioPreferences.keyboardShortcuts,
        });
      }
    } catch {
      setPreferences(defaultStudioPreferences);
    } finally {
      setPreferencesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesLoaded || typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(STUDIO_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [preferences, preferencesLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = localStorage.getItem(payoutStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<StudioPayoutSettings>;
      setPayoutSettings({
        method:
          parsed.method === "paypal" || parsed.method === "bank" || parsed.method === "crypto"
            ? parsed.method
            : defaultPayoutSettings.method,
        destination:
          typeof parsed.destination === "string" ? parsed.destination : defaultPayoutSettings.destination,
        minPayout:
          typeof parsed.minPayout === "number" && Number.isFinite(parsed.minPayout)
            ? Math.min(10000, Math.max(10, Math.round(parsed.minPayout)))
            : defaultPayoutSettings.minPayout,
      });
    } catch {
      setPayoutSettings(defaultPayoutSettings);
    }
  }, [payoutStorageKey]);

  useEffect(() => {
    if (!supabase || !sessionId || !isOwner) {
      setTermsAcceptance(loadLocalTermsAcceptance());
      setTermsLoading(false);
      return;
    }
    let active = true;
    setTermsLoading(true);
    supabase
      .from("studio_terms_acceptances")
      .select("accepted_at, terms_version")
      .eq("user_id", sessionId)
      .eq("terms_key", "studio_contract")
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          const relationMissing = error.code === "42P01" || /studio_terms_acceptances/i.test(error.message);
          if (!relationMissing) {
            showNotice("warn", "No se pudo verificar el contrato.");
          }
          setTermsAcceptance(loadLocalTermsAcceptance());
          setTermsLoading(false);
          return;
        }
        if (!data) {
          setTermsAcceptance(defaultTermsAcceptance);
          setTermsLoading(false);
          return;
        }
        setTermsAcceptance({
          accepted: true,
          acceptedAt: data.accepted_at ?? null,
          version: data.terms_version ?? STUDIO_TERMS_VERSION,
        });
        setTermsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOwner, loadLocalTermsAcceptance, sessionId, showNotice]);

  useEffect(() => {
    if (!preferencesLoaded || !preferences.reopenLastSection || !!studioIntent || typeof window === "undefined") {
      return;
    }
    try {
      const rawSection = localStorage.getItem(lastSectionStorageKey);
      if (isStudioSection(rawSection)) {
        setActiveSection(rawSection);
      }
    } catch {
      // ignore
    }
  }, [lastSectionStorageKey, preferences.reopenLastSection, preferencesLoaded, studioIntent]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = localStorage.getItem(monetizationIntentStorageKey);
      setWantsMonetization(raw === "1");
    } catch {
      setWantsMonetization(false);
    }
  }, [monetizationIntentStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(monetizationIntentStorageKey, wantsMonetization ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [monetizationIntentStorageKey, wantsMonetization]);

  useEffect(() => {
    if (!preferencesLoaded || !preferences.reopenLastSection || typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(lastSectionStorageKey, activeSection);
    } catch {
      // ignore
    }
  }, [activeSection, lastSectionStorageKey, preferences.reopenLastSection, preferencesLoaded]);

  useEffect(() => {
    if (!preferences.keyboardShortcuts) {
      return;
    }
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (!isTypingTarget && event.key === "/") {
        event.preventDefault();
        setActiveSection("proyectos");
        searchInputRef.current?.focus();
        return;
      }
      if (isTypingTarget) {
        return;
      }
      if (event.key >= "1" && event.key <= "6") {
        const section = STUDIO_SECTIONS[Number(event.key) - 1];
        if (section) {
          event.preventDefault();
          setActiveSection(section);
        }
        return;
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setUploadMenuOpen(false);
        setSelectedProject(null);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [preferences.keyboardShortcuts]);

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
      const fallbackRoute = resolvedUsername ? `/visuales/estudio/${resolvedUsername}` : "/visuales";
      router.replace(`/auth?returnTo=${encodeURIComponent(fallbackRoute)}`);
    }
  }, [isGuest, resolvedUsername, router, sessionId]);

  useEffect(() => {
    ensureExplorerMembership(supabase, sessionId, "visuales").catch(() => undefined);
  }, [sessionId]);

  useEffect(() => {
    loadOwnedProjects();
  }, [loadOwnedProjects]);

  useEffect(() => {
    loadSubaccounts();
  }, [loadSubaccounts]);

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

  const handleSavePayoutSettings = async () => {
    if (!isOwner) {
      showNotice("warn", "Solo el propietario puede editar pagos.");
      return;
    }
    if (!wantsMonetization) {
      setWantsMonetization(true);
      showNotice("warn", "Activa monetizacion y acepta el contrato para configurar pagos.");
      setActiveSection("acuerdos");
      return;
    }
    if (!isTermsAccepted) {
      showNotice("warn", "Debes aceptar el contrato antes de configurar pagos.");
      setActiveSection("acuerdos");
      return;
    }
    if (!payoutSettings.destination.trim()) {
      showNotice("warn", "Completa el destino de cobro.");
      return;
    }
    setPayoutSaving(true);
    try {
      const normalized = {
        ...payoutSettings,
        destination: payoutSettings.destination.trim(),
        minPayout: Math.min(10000, Math.max(10, Math.round(payoutSettings.minPayout))),
      };
      localStorage.setItem(payoutStorageKey, JSON.stringify(normalized));
      setPayoutSettings(normalized);
      showNotice("ok", "Configuracion de pagos guardada.");
    } catch {
      showNotice("warn", "No se pudo guardar la configuracion de pagos.");
    } finally {
      setPayoutSaving(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!isOwner || !sessionId) {
      showNotice("warn", "Solo el propietario puede aceptar el contrato.");
      return;
    }
    if (isTermsAccepted) {
      showNotice("ok", "El contrato ya fue aceptado.");
      return;
    }
    setTermsAccepting(true);
    try {
      const acceptedAt = new Date().toISOString();
      const nextTerms: StudioTermsAcceptance = {
        accepted: true,
        acceptedAt,
        version: STUDIO_TERMS_VERSION,
      };
      if (supabase) {
        const { error } = await supabase.from("studio_terms_acceptances").upsert(
          {
            user_id: sessionId,
            terms_key: "studio_contract",
            terms_version: STUDIO_TERMS_VERSION,
            accepted_at: acceptedAt,
          },
          { onConflict: "user_id,terms_key" }
        );
        const relationMissing = error?.code === "42P01" || /studio_terms_acceptances/i.test(error?.message ?? "");
        if (error && !relationMissing) {
          showNotice("warn", error.message);
          return;
        }
      }
      localStorage.setItem(termsStorageKey, JSON.stringify(nextTerms));
      setTermsAcceptance(nextTerms);
      showNotice("ok", "Contrato aceptado. Ya puedes usar Pagos.");
    } finally {
      setTermsAccepting(false);
    }
  };

  const handleCreateSubaccount = async () => {
    if (!supabase || !sessionId || !isOwner) {
      setSubaccountMessage(tx("Solo el propietario puede crear subcuentas.", "Only the owner can create subaccounts."));
      return;
    }
    if (totalSubaccountsLeft <= 0) {
      setSubaccountMessage(tx("Ya alcanzaste el maximo de 10 subcuentas.", "You already reached the maximum of 10 subaccounts."));
      return;
    }
    if (recentSubaccountsLeft <= 0) {
      setSubaccountMessage(tx("Limite alcanzado: maximo 3 subcuentas cada 6 meses.", "Limit reached: maximum 3 subaccounts every 6 months."));
      return;
    }
    setSubaccountBusy(true);
    setSubaccountMessage(null);
    const nextUsername = subaccountUsername.trim().replace(/^@+/, "").toLowerCase();
    const nextDisplayName = subaccountDisplayName.trim();
    if (nextUsername.length < 3 || nextUsername.length > 24 || !/^[a-z0-9-_]+$/.test(nextUsername)) {
      setSubaccountMessage(tx("Usuario invalido. Usa 3-24 caracteres y solo letras, numeros, - o _.", "Invalid username. Use 3-24 chars with letters, numbers, - or _."));
      setSubaccountBusy(false);
      return;
    }
    const { error } = await supabase.rpc("create_visuales_account", {
      p_username: nextUsername,
      p_display_name: nextDisplayName || null,
    });
    if (error) {
      setSubaccountMessage(error.message);
      setSubaccountBusy(false);
      return;
    }
    setSubaccountUsername("");
    setSubaccountDisplayName("");
    setSubaccountMessage(tx("Subcuenta creada correctamente.", "Subaccount created successfully."));
    setSubaccountBusy(false);
    await loadSubaccounts();
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
              <span className="hub-brand__subtitle">{tx("Estudio creativo", "Creative studio")}</span>
            </span>
          </Link>
        </div>
        <div className="hub-search">
          <input
            ref={searchInputRef}
            type="search"
            placeholder={tx("Buscar en tu estudio...", "Search in your studio...")}
            aria-label={tx("Buscar en tu estudio", "Search in your studio")}
            value={projectSearch}
            onFocus={() => setActiveSection("proyectos")}
            onChange={(event) => {
              setProjectSearch(event.target.value);
              if (activeSection !== "proyectos") {
                setActiveSection("proyectos");
              }
            }}
          />
        </div>
        <div className="hub-topbar__actions">
          <button type="button" className="hub-upload-button" onClick={() => setUiLanguage(language === "es" ? "en" : "es")}>
            {language.toUpperCase()}
          </button>
          <button
            type="button"
            className="hub-search-toggle"
            aria-label={tx("Buscar", "Search")}
            onClick={() => {
              setActiveSection("proyectos");
              searchInputRef.current?.focus();
            }}
          >
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
              {tx("Subir proyecto", "Upload project")}
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
                  {tx("Subir archivo", "Upload file")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    setActiveSection("subidas");
                  }}
                >
                  {tx("Crear publicacion", "Create post")}
                </button>
              </div>
            ) : null}
          </div>
          <div className="hub-account-menu" ref={menuRef}>
            <button
              type="button"
              className="visuales-avatar visuales-avatar--button"
              aria-label={tx("Abrir menu de cuenta", "Open account menu")}
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setUploadMenuOpen(false);
              }}
            >
              <span>{avatarInitial}</span>
            </button>
            {menuOpen ? (
              <div className="hub-account-menu__panel">
                <div className="hub-account-menu__status">{tx("Estado sesion", "Session status")}: {isGuest ? tx("Invitado", "Guest") : tx("Activa", "Active")}</div>
                <div className="hub-account-menu__profile">
                  <div className="hub-account-menu__name">{settingsName || studioName.replace(/^@/, "")}</div>
                  <div className="hub-account-menu__handle">@{normalizeSlug(studioName)}</div>
                </div>
                <Link href="/visuales" onClick={() => setMenuOpen(false)}>
                  {tx("Ir al hub", "Go to hub")}
                </Link>
                <button type="button" onClick={handleSwitchAccount}>
                  {tx("Cambiar cuenta", "Switch account")}
                </button>
                <button type="button" onClick={handleSignOut}>
                  Cerrar sesion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {notice ? (
        <div className={`cabina-notice${notice.tone === "warn" ? " is-warn" : ""}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      ) : null}
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
              Contrato
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
            activeSection !== "pagos" &&
            activeSection !== "acuerdos" &&
            activeSection !== "personalizar" &&
            activeSection !== "preferencias" ? (
              <div className="cabina-projects-empty">
                <p>{currentSection.empty}</p>
              </div>
            ) : null}
            {activeSection === "proyectos" ? (
              <section className="cabina-projects__list">
                <div className="cabina-projects__header">
                  <div className="cabina-projects__toolbar">
                    <input
                      type="search"
                      placeholder={tx("Filtrar proyectos por titulo, tipo o descripcion...", "Filter projects by title, type, or description...")}
                      value={projectSearch}
                      onChange={(event) => setProjectSearch(event.target.value)}
                      aria-label={tx("Filtrar proyectos", "Filter projects")}
                    />
                    <select
                      value={projectSort}
                      onChange={(event) => setProjectSort(event.target.value as StudioSort)}
                      aria-label={tx("Ordenar proyectos", "Sort projects")}
                    >
                      <option value="newest">{tx("Mas recientes", "Newest")}</option>
                      <option value="oldest">{tx("Mas antiguos", "Oldest")}</option>
                      <option value="title-az">{tx("Titulo A-Z", "Title A-Z")}</option>
                      <option value="title-za">{tx("Titulo Z-A", "Title Z-A")}</option>
                    </select>
                  </div>
                  <span>{visibleProjects.length} {tx("resultado(s)", "result(s)")}</span>
                  {projectsLoading ? <span>{tx("Cargando...", "Loading...")}</span> : null}
                </div>
                {visibleProjects.length === 0 && !projectsLoading ? (
                  hasProjectSearch ? (
                    <p className="cabina-projects__hint">
                      No encontramos proyectos con &quot;{projectSearch.trim()}&quot;.
                    </p>
                  ) : (
                  <p className="cabina-projects__hint">Aun no has publicado proyectos.</p>
                  )
                ) : (
                  ["imagen", "video", "animacion", "interactivo", "otro"].map((category) => {
                    const items = visibleProjects.filter((project) => (project.type ?? "otro") === category);
                    if (!items.length) {
                      return null;
                    }
                    return (
                      <div key={category} className="cabina-projects__category">
                        <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className={`cabina-projects__grid${preferences.compactProjectGrid ? " is-compact" : ""}`}>
                          {items.map((project) => (
                            <article
                              key={project.id}
                              className="cabina-projects__card"
                              onClick={() => setSelectedProject(project)}
                            >
                              <button
                                type="button"
                                className="cabina-projects__card-hitbox"
                                aria-label={tx("Abrir detalles del proyecto", "Open project details")}
                                onClick={() => setSelectedProject(project)}
                              />
                              <div className="cabina-projects__media" onClick={() => setSelectedProject(project)}>
                                {(() => {
                                  const mediaUrl = resolveMediaUrl(project.media_url);
                                  if (project.type === "video" && mediaUrl) {
                                    return (
                                      <video
                                        src={mediaUrl}
                                        muted
                                        playsInline
                                        autoPlay={preferences.autoplayPreview}
                                        loop={preferences.autoplayPreview}
                                      />
                                    );
                                  }
                                  if (mediaUrl) {
                                    return <img src={mediaUrl} alt={project.title ?? tx("Proyecto", "Project")} />;
                                  }
                                  return <div className="cabina-projects__hint">{tx("Sin media", "No media")}</div>;
                                })()}
                              </div>
                              <div className="cabina-projects__meta" onClick={() => setSelectedProject(project)}>
                                <h5>{project.title ?? tx("Proyecto sin titulo", "Untitled project")}</h5>
                                <p>{project.description ?? tx("Sin descripcion", "No description")}</p>
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
            {activeSection === "pagos" ? (
              <section className="cabina-settings">
                <div className="cabina-settings__card">
                  <div className="cabina-settings__header">
                    <h3>Resumen de pagos</h3>
                    <p>Estimacion basada en rendimiento de tus proyectos publicados.</p>
                  </div>
                  {!wantsMonetization ? (
                    <div className="cabina-contract-block">
                      <p>La monetizacion esta desactivada. Activala en Preferencias solo si quieres cobrar por tu contenido.</p>
                      <button
                        type="button"
                        className="cabina-dashboard__action cabina-dashboard__action--ghost"
                        onClick={() => setActiveSection("preferencias")}
                      >
                        Ir a Preferencias
                      </button>
                    </div>
                  ) : !isTermsAccepted ? (
                    <div className="cabina-contract-block">
                      <p>Para activar pagos, primero acepta el contrato en la seccion Contrato.</p>
                      <button
                        type="button"
                        className="cabina-dashboard__action cabina-dashboard__action--ghost"
                        onClick={() => setActiveSection("acuerdos")}
                      >
                        Ir a Contrato
                      </button>
                    </div>
                  ) : null}
                  {wantsMonetization && isTermsAccepted ? (
                    <>
                  <div className="cabina-payout-cards">
                    <article>
                      <span>Disponible</span>
                      <strong>US$ {payoutSummary.available.toFixed(2)}</strong>
                    </article>
                    <article>
                      <span>Pendiente</span>
                      <strong>US$ {payoutSummary.pending.toFixed(2)}</strong>
                    </article>
                    <article>
                      <span>Total estimado</span>
                      <strong>US$ {payoutSummary.gross.toFixed(2)}</strong>
                    </article>
                  </div>
                  <div className="cabina-settings__grid">
                    <label className="cabina-settings__field">
                      <span>Metodo de cobro</span>
                      <select
                        value={payoutSettings.method}
                        disabled={!isOwner}
                        onChange={(event) =>
                          setPayoutSettings((prev) => ({
                            ...prev,
                            method: event.target.value as StudioPayoutMethod,
                          }))
                        }
                      >
                        <option value="paypal">PayPal</option>
                        <option value="bank">Transferencia bancaria</option>
                        <option value="crypto">Crypto (USDT)</option>
                      </select>
                    </label>
                    <label className="cabina-settings__field">
                      <span>Destino</span>
                      <input
                        value={payoutSettings.destination}
                        disabled={!isOwner}
                        placeholder={tx("correo, IBAN o wallet", "email, IBAN, or wallet")}
                        onChange={(event) =>
                          setPayoutSettings((prev) => ({ ...prev, destination: event.target.value }))
                        }
                      />
                    </label>
                    <label className="cabina-settings__field">
                      <span>Minimo para retiro (USD)</span>
                      <input
                        type="number"
                        min={10}
                        max={10000}
                        value={payoutSettings.minPayout}
                        disabled={!isOwner}
                        onChange={(event) =>
                          setPayoutSettings((prev) => ({
                            ...prev,
                            minPayout: Number(event.target.value || defaultPayoutSettings.minPayout),
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className="cabina-payout-actions">
                    <button
                      type="button"
                      className="cabina-dashboard__action"
                      onClick={handleSavePayoutSettings}
                      disabled={!isOwner || payoutSaving}
                    >
                      {payoutSaving ? "Guardando..." : "Guardar configuracion"}
                    </button>
                    <button
                      type="button"
                      className="cabina-dashboard__action cabina-dashboard__action--ghost"
                      disabled={!isOwner || payoutSummary.available < payoutSettings.minPayout}
                      onClick={() => {
                        if (payoutSummary.available < payoutSettings.minPayout) {
                          showNotice("warn", "Aun no llegas al minimo de retiro.");
                          return;
                        }
                        showNotice("ok", "Solicitud de retiro registrada.");
                      }}
                    >
                      Solicitar retiro
                    </button>
                  </div>
                  <div className="cabina-payout-table">
                    <div className="cabina-payout-table__head">
                      <strong>Proyecto</strong>
                      <strong>Vistas</strong>
                      <strong>Interacciones</strong>
                      <strong>Estimado</strong>
                    </div>
                    {payoutRows.length === 0 ? (
                      <p className="cabina-projects__hint">Publica proyectos para ver estimaciones de pago.</p>
                    ) : (
                      payoutRows.slice(0, 8).map((row) => (
                        <div key={row.id} className="cabina-payout-table__row">
                          <span>{row.title}</span>
                          <span>{formatCompactMetric(row.views)}</span>
                          <span>{formatCompactMetric(row.likes + row.shares)}</span>
                          <span>US$ {row.estimate.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}
            {activeSection === "acuerdos" ? (
              <section className="cabina-settings">
                <div className="cabina-settings__card">
                  <div className="cabina-settings__header">
                    <h3>Contrato de uso y pagos</h3>
                    <p>Este contrato solo aplica cuando decides monetizar contenido.</p>
                  </div>
                  {!wantsMonetization ? (
                    <div className="cabina-contract-block">
                      <p>
                        Este contrato solo se aplica cuando monetizas. Si solo publicas sin cobrar, no necesitas aceptarlo.
                      </p>
                      <button
                        type="button"
                        className="cabina-dashboard__action cabina-dashboard__action--ghost"
                        onClick={() => setActiveSection("preferencias")}
                      >
                        Configurar en Preferencias
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="cabina-contract">
                        <h4>Condiciones principales</h4>
                        <ul>
                          <li>Los pagos se habilitan solo para cuentas verificadas y con actividad legitima.</li>
                          <li>El contenido subido debe respetar derechos de autor y normas de la plataforma.</li>
                          <li>Las estimaciones de ingresos son orientativas y pueden ajustarse por revision interna.</li>
                          <li>El estudio acepta cumplir politicas anti-fraude y de uso responsable.</li>
                        </ul>
                        <p>
                          Version del contrato: <strong>{STUDIO_TERMS_VERSION}</strong>
                        </p>
                        {termsAcceptance.acceptedAt ? (
                          <p>
                            Aceptado el: <strong>{new Date(termsAcceptance.acceptedAt).toLocaleString()}</strong>
                          </p>
                        ) : null}
                      </div>
                      {termsLoading ? (
                        <p className="cabina-projects__hint">Verificando estado de contrato...</p>
                      ) : isTermsAccepted ? (
                        <p className="cabina-contract__ok">Contrato aceptado. Pagos habilitado.</p>
                      ) : (
                        <button
                          type="button"
                          className="cabina-dashboard__action"
                          disabled={!isOwner || termsAccepting}
                          onClick={handleAcceptTerms}
                        >
                          {termsAccepting ? "Aceptando..." : "Aceptar contrato"}
                        </button>
                      )}
                    </>
                  )}
                </div>
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
                    {selectedProject.type === "video" && selectedProjectMediaUrl ? (
                      <video src={selectedProjectMediaUrl} controls playsInline />
                    ) : selectedProjectMediaUrl ? (
                      <img src={selectedProjectMediaUrl} alt={selectedProject.title ?? "Proyecto"} />
                    ) : (
                      <div className="cabina-projects__hint">{tx("Sin media", "No media")}</div>
                    )}
                  </div>
                  {isOwner ? (
                    <div className="cabina-projects__edit">
                      <div className="cabina-projects__edit-preview">
                        <span>Vista previa</span>
                        {selectedProject.type === "video" && selectedProjectMediaUrl ? (
                          <video src={selectedProjectMediaUrl} controls playsInline />
                        ) : selectedProjectMediaUrl ? (
                          <img src={selectedProjectMediaUrl} alt={selectedProject.title ?? "Proyecto"} />
                        ) : (
                          <div className="cabina-projects__hint">{tx("Sin media", "No media")}</div>
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
                                  const mediaUrl = selectedProjectMediaUrl;
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
                        placeholder={tx("Cuenta tu historia creativa...", "Tell your creative story...")}
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
                <div className="cabina-settings__card">
                  <div className="cabina-settings__header">
                    <h3>Subcuentas Visuales</h3>
                    <p>
                      Crea cuentas adicionales sin cambiar correo. Limites: 10 totales, 3 nuevas cada 6 meses.
                    </p>
                  </div>
                  <div className="cabina-subaccounts__quota">
                    <span>Total disponible: {totalSubaccountsLeft}</span>
                    <span>Disponibles este semestre: {recentSubaccountsLeft}</span>
                  </div>
                  <div className="cabina-settings__grid">
                    <label className="cabina-settings__field">
                      <span>Usuario de subcuenta</span>
                      <input
                        value={subaccountUsername}
                        placeholder={tx("ejemplo-cuenta", "example-account")}
                        disabled={!isOwner || subaccountBusy}
                        onChange={(event) => setSubaccountUsername(event.target.value)}
                      />
                    </label>
                    <label className="cabina-settings__field">
                      <span>Nombre visible</span>
                      <input
                        value={subaccountDisplayName}
                        placeholder={tx("Nombre para mostrar", "Display name")}
                        disabled={!isOwner || subaccountBusy}
                        onChange={(event) => setSubaccountDisplayName(event.target.value)}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="cabina-dashboard__action"
                    onClick={handleCreateSubaccount}
                    disabled={!isOwner || subaccountBusy || totalSubaccountsLeft <= 0 || recentSubaccountsLeft <= 0}
                  >
                    {subaccountBusy ? "Creando..." : "Crear subcuenta"}
                  </button>
                  {subaccountMessage ? <p className="cabina-settings__message">{subaccountMessage}</p> : null}
                  {subaccountsLoading ? (
                    <p className="cabina-projects__hint">Cargando subcuentas...</p>
                  ) : subaccounts.length === 0 ? (
                    <p className="cabina-projects__hint">No tienes subcuentas creadas.</p>
                  ) : (
                    <div className="cabina-subaccounts">
                      {subaccounts.map((account) => (
                        <article key={account.id} className="cabina-subaccounts__item">
                          <div>
                            <strong>@{account.username}</strong>
                            <p>{account.display_name || "Sin nombre visible"}</p>
                          </div>
                          <span>
                            {account.created_at
                              ? new Date(account.created_at).toLocaleDateString()
                              : "Fecha no disponible"}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
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
                  <div className="cabina-prefs">
                    <label className="cabina-prefs__item">
                      <div>
                        <strong>Monetizacion</strong>
                        <p>Activa o desactiva pagos y contrato para este estudio.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={wantsMonetization}
                        disabled={!isOwner}
                        onChange={(event) => {
                          const nextValue = event.target.checked;
                          setWantsMonetization(nextValue);
                          showNotice(
                            "ok",
                            nextValue
                              ? "Monetizacion activada. Revisa Contrato para habilitar pagos."
                              : "Monetizacion desactivada. Pagos y contrato quedan en modo informativo."
                          );
                        }}
                      />
                    </label>
                    <label className="cabina-prefs__item">
                      <div>
                        <strong>Autoplay en previews de video</strong>
                        <p>Reproduce miniaturas de video automaticamente en Proyectos.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.autoplayPreview}
                        onChange={(event) =>
                          setPreferences((prev) => ({ ...prev, autoplayPreview: event.target.checked }))
                        }
                      />
                    </label>
                    <label className="cabina-prefs__item">
                      <div>
                        <strong>Vista compacta de grilla</strong>
                        <p>Muestra mas tarjetas por fila en la seccion de proyectos.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.compactProjectGrid}
                        onChange={(event) =>
                          setPreferences((prev) => ({ ...prev, compactProjectGrid: event.target.checked }))
                        }
                      />
                    </label>
                    <label className="cabina-prefs__item">
                      <div>
                        <strong>Reabrir ultima seccion</strong>
                        <p>Al volver al estudio, recuerda la seccion activa.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.reopenLastSection}
                        onChange={(event) =>
                          setPreferences((prev) => ({ ...prev, reopenLastSection: event.target.checked }))
                        }
                      />
                    </label>
                    <label className="cabina-prefs__item">
                      <div>
                        <strong>Atajos de teclado</strong>
                        <p>Usa 1-6 para secciones, / para buscar y Esc para cerrar paneles.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.keyboardShortcuts}
                        onChange={(event) =>
                          setPreferences((prev) => ({ ...prev, keyboardShortcuts: event.target.checked }))
                        }
                      />
                    </label>
                  </div>
                  <p className="cabina-projects__hint">Preferencias guardadas localmente en este navegador.</p>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
