"use client";

import { useEffect, useMemo, useState } from "react";
import { getBrandConfig } from "@/brands";
import { APP_ROUTES } from "@/shared/routes/brand-routes";

export type SwarmMode = "cinematic" | "balanced" | "efficient";

export type SwarmProfile = {
  mode: SwarmMode;
  trustSignals: string[];
  quickLinks: Array<{ href: string; label: string }>;
  tileRouteMap: Record<string, string>;
};

const ROOT_BRAND = getBrandConfig("codevamp");

export function useExperienceSwarm() {
  const [mode, setMode] = useState<SwarmMode>("balanced");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (media.matches) {
        setMode("efficient");
        return;
      }
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean; effectiveType?: string };
      };
      const memory = nav.deviceMemory ?? 4;
      const cores = nav.hardwareConcurrency ?? 4;
      const saveData = Boolean(nav.connection?.saveData);
      const network = nav.connection?.effectiveType ?? "4g";
      if (saveData || /2g|slow-2g/.test(network) || memory <= 4 || cores <= 4) {
        setMode("efficient");
        return;
      }
      if (memory >= 8 && cores >= 8) {
        setMode("cinematic");
        return;
      }
      setMode("balanced");
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  return useMemo<SwarmProfile>(() => {
    const trustSignals =
      mode === "cinematic"
        ? [
            "Experiencia visual avanzada con ajuste inteligente de calidad",
            "Sesion y trafico protegidos con TLS y politicas de seguridad activas",
            "Controles de privacidad y cumplimiento disponibles desde Legal",
          ]
        : [
            "Rendimiento optimizado por dispositivo sin perder identidad visual",
            "Proteccion de cabeceras web y aislamiento de contenido por defecto",
            "Politicas y terminos accesibles para usuarios y colaboradores",
          ];
    return {
      mode,
      trustSignals,
      quickLinks: ROOT_BRAND.quickLinks,
      tileRouteMap: {
        ...ROOT_BRAND.homeTileRoutes,
        audio: APP_ROUTES.audio,
      },
    };
  }, [mode]);
}
