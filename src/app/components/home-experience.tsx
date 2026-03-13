"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ForestScene from "./forest-scene";
import SiteShell from "./site-shell";
import { useExperienceSwarm } from "../lib/experience-swarm";
import { supabase } from "../lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { createUiCopyResolver, type UiCopyMap } from "@/shared/i18n/ui-copy";

export default function HomeExperience() {
  const swarm = useExperienceSwarm();
  const { language } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);
  const sharedCopy = {
    account: { es: "Cuenta", en: "Account" },
    sessionStatus: { es: "Estado sesion:", en: "Session status:" },
    active: { es: "Activa", en: "Active" },
    signedOut: { es: "Sin sesion", en: "Signed out" },
    checking: { es: "Verificando...", en: "Checking..." },
    signOut: { es: "Cerrar sesion", en: "Sign out" },
    codevampAccess: { es: "Acceso CodevaMP", en: "CodevaMP access" },
  } satisfies UiCopyMap<"account" | "sessionStatus" | "active" | "signedOut" | "checking" | "signOut" | "codevampAccess">;
  const t = createUiCopyResolver(sharedCopy, language);
  const accountLabel = t("account");
  const navDescriptions: Record<string, string> = {
    "/explorar": tx("Mapa interactivo del laboratorio", "Interactive lab map"),
    "/dev": tx("Herramientas, studio y productos publicados", "Tools, studio, and published products"),
    "/visuales": tx("Comunidad y publicaciones visuales", "Community and visual publishing"),
    "/dashboard": tx("Resumen ejecutivo entre subempresas", "Executive summary across subcompanies"),
    "/estrategia": tx("Plan de valor, crecimiento y sostenibilidad", "Value, growth, and sustainability plan"),
    "/acerca": tx("Contexto y base del estudio", "Studio context and foundation"),
  };
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [sessionLabel, setSessionLabel] = useState(accountLabel);

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
      const user = data.session?.user ?? null;
      setSessionUserId(user?.id ?? null);
      const username = (user?.user_metadata?.username as string | undefined)?.trim();
      const email = (user?.email as string | undefined) ?? "";
      setSessionLabel(username ? `@${username}` : email || accountLabel);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSessionUserId(user?.id ?? null);
      const username = (user?.user_metadata?.username as string | undefined)?.trim();
      const email = (user?.email as string | undefined) ?? "";
      setSessionLabel(username ? `@${username}` : email || accountLabel);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [accountLabel]);

  const authHref = useMemo(() => `/auth?returnTo=${encodeURIComponent("/")}`, []);

  return (
    <SiteShell currentPath="/" disableEffects className="home-premium-shell">
      <section id="hero-section" className="scene-panel scene-panel--visual" aria-label={tx("Escena interactiva", "Interactive scene")}>
        <ForestScene qualityMode={swarm.mode} routeMap={swarm.tileRouteMap} />

        <div className="home-swarm-nav" aria-label={tx("Accesos rapidos", "Quick access")}>
          <p className="home-swarm-nav__label">{tx("Navegacion", "Navigation")}</p>
          <div className="home-swarm-nav__list">
            {swarm.quickLinks.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="home-swarm-nav__link"
                data-desc={navDescriptions[item.href] ?? tx("Ruta principal", "Main route")}
                title={navDescriptions[item.href] ?? tx("Ruta principal", "Main route")}
              >
                <span className="home-swarm-nav__link-title">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="home-swarm-auth">
            <p className="home-swarm-auth__status">
              {t("sessionStatus")}{" "}
              {sessionUserId ? t("active") : sessionUserId === null ? t("signedOut") : t("checking")}
            </p>
            {sessionUserId ? (
              <div className="home-swarm-auth__actions">
                <Link href="/auth" className="home-swarm-nav__link home-swarm-nav__link--plain">
                  <span className="home-swarm-nav__link-title">{t("account")} ({sessionLabel})</span>
                </Link>
                <button
                  type="button"
                  className="home-swarm-auth__button"
                  onClick={async () => {
                    if (!supabase) {
                      return;
                    }
                    await supabase.auth.signOut();
                    setSessionUserId(null);
                    setSessionLabel(accountLabel);
                  }}
                >
                  {t("signOut")}
                </button>
              </div>
            ) : (
              <Link href={authHref} className="home-swarm-nav__link home-swarm-nav__link--plain">
                <span className="home-swarm-nav__link-title">{t("codevampAccess")}</span>
              </Link>
            )}
          </div>
        </div>

      </section>

      <section className="home-root-deck" id="intro-section" aria-label={tx("Rutas principales de CodevaMP", "Main CodevaMP routes")}>
        <div className="home-root-deck__inner">
          <header className="home-root-deck__header">
            <p className="home-root-deck__kicker">{tx("CodevaMP raiz", "CodevaMP root")}</p>
            <h2>{tx("Un solo ecosistema, multiples frentes creativos y tecnicos.", "One ecosystem, multiple creative and technical fronts.")}</h2>
            <p>
              {tx(
                "Debajo del planeta consolidamos las rutas clave del estudio para que la exploracion tenga continuidad y no termine en una sola escena.",
                "Below the planet we consolidate key studio routes so exploration keeps momentum instead of ending in one scene."
              )}
            </p>
          </header>

          <div className="home-root-deck__grid">
            <Link href="/acerca" className="home-root-deck__card">
              <span>{tx("Acerca", "About")}</span>
              <strong>{tx("Vision, principios y ritmo del estudio.", "Vision, principles, and studio rhythm.")}</strong>
            </Link>
            <Link href="/explorar" className="home-root-deck__card">
              <span>{tx("Explorar", "Explore")}</span>
              <strong>{tx("Mapa activo de experiencias y laboratorios.", "Active map of experiences and labs.")}</strong>
            </Link>
            <Link href="/dev" className="home-root-deck__card">
              <span>Dev</span>
              <strong>{tx("Productos, studio y proyectos publicados.", "Products, studio, and published projects.")}</strong>
            </Link>
            <Link href="/audio" className="home-root-deck__card">
              <span>Audio</span>
              <strong>{tx("Nueva unidad para experiencias sonoras interactivas.", "New unit for interactive sonic experiences.")}</strong>
            </Link>
            <Link href="/dashboard" className="home-root-deck__card">
              <span>Dashboard</span>
              <strong>{tx("Metricas comparables por subempresa y embudo comun.", "Comparable metrics by subcompany and shared funnel.")}</strong>
            </Link>
            <Link href="/estrategia" className="home-root-deck__card">
              <span>{tx("Estrategia", "Strategy")}</span>
              <strong>{tx("Hoja de ruta 2026: producto, mercado e impacto.", "2026 roadmap: product, market, and impact.")}</strong>
            </Link>
            <Link href="/donaciones" className="home-root-deck__card">
              <span>{tx("Donaciones", "Donations")}</span>
              <strong>{tx("Modelo de apoyo para sostener desarrollo continuo.", "Support model to sustain continuous development.")}</strong>
            </Link>
            <Link href="/legal" className="home-root-deck__card">
              <span>Legal</span>
              <strong>{tx("Marco de seguridad, privacidad y cumplimiento.", "Security, privacy, and compliance framework.")}</strong>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
