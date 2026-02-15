import type { BrandId } from "@/brands";

export const APP_ROUTES = {
  home: "/",
  explorar: "/explorar",
  proyectos: "/proyectos",
  legal: "/legal",
  donaciones: "/donaciones",
  visuales: "/visuales",
  visualesApp: "/visuales/app",
  visualesAuth: "/visuales/auth",
  audio: "/audio",
} as const;

export function getBrandBasePath(brandId: BrandId): string {
  if (brandId === "visuales") {
    return APP_ROUTES.visuales;
  }
  if (brandId === "audio") {
    return APP_ROUTES.audio;
  }
  return APP_ROUTES.home;
}
