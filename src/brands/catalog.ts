import type { BrandConfig } from "./types";

export const BRAND_CATALOG: Record<string, BrandConfig> = {
  codevamp: {
    id: "codevamp",
    name: "CodevaMP Studio",
    basePath: "/",
    tagline: "laboratorio de sistemas interactivos",
    description: "Mini-apps, prototipos jugables, herramientas y experiencias modulares.",
    palette: {
      primary: "#ff5a1f",
      primaryStrong: "#ff3d00",
      neutralLight: "#ffffff",
      neutralDark: "#060606",
    },
    quickLinks: [
      { href: "/explorar", label: "Explorar" },
      { href: "/proyectos", label: "Proyectos" },
      { href: "/visuales", label: "Visuales" },
      { href: "/acerca", label: "Acerca" },
    ],
    homeTileRoutes: {
      lab: "/acerca",
      explorar: "/explorar",
      audio: "/audio",
      prototipos: "/proyectos",
      mapa: "/visuales",
      archivo: "/proyectos",
      comunidad: "/donaciones",
      energia: "/legal",
    },
  },
  visuales: {
    id: "visuales",
    name: "CodevaMP Visuales",
    basePath: "/visuales",
    tagline: "estudio creativo",
    description: "Feed, estudio y publicacion de proyectos visuales.",
    palette: {
      primary: "#ff5a1f",
      primaryStrong: "#ff3d00",
      neutralLight: "#ffffff",
      neutralDark: "#121215",
    },
    quickLinks: [
      { href: "/visuales", label: "Inicio" },
      { href: "/visuales/app", label: "App" },
      { href: "/visuales/auth", label: "Acceso" },
    ],
    homeTileRoutes: {},
  },
  audio: {
    id: "audio",
    name: "CodevaMP Audio",
    basePath: "/audio",
    tagline: "experiencias sonoras",
    description: "Canal reservado para la mini empresa de audio.",
    palette: {
      primary: "#ff5a1f",
      primaryStrong: "#ff3d00",
      neutralLight: "#ffffff",
      neutralDark: "#101114",
    },
    quickLinks: [{ href: "/audio", label: "Audio" }],
    homeTileRoutes: {},
  },
};
