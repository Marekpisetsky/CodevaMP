import type { BrandId } from "@/brands";

export const APP_ROUTES = {
  home: "/",
  explorar: "/explorar",
  proyectos: "/dev",
  dev: "/dev",
  dashboard: "/dashboard",
  estrategia: "/estrategia",
  legal: "/legal",
  donaciones: "/donaciones",
  visuales: "/visuales",
  visualesApp: "/visuales/app",
  visualesAuth: "/auth",
  audio: "/audio",
} as const;

export function getBrandBasePath(brandId: BrandId): string {
  if (brandId === "dev") {
    return APP_ROUTES.dev;
  }
  if (brandId === "visuales") {
    return APP_ROUTES.visuales;
  }
  if (brandId === "audio") {
    return APP_ROUTES.audio;
  }
  return APP_ROUTES.home;
}
