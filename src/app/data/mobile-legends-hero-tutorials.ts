export type MobileLegendsHeroTutorial = {
  hero: string;
  role: string;
  lane: string;
  difficulty: "Iniciación" | "Intermedio" | "Avanzado";
  duration: string;
  format: "Video" | "PDF" | "Checklist" | "Sesión en vivo";
  focus: string[];
  summary: string;
  url: string;
  lastUpdate: string;
};

export const mlbbHeroTutorials: MobileLegendsHeroTutorial[] = [
  {
    hero: "Khufra",
    role: "Tank",
    lane: "Roam",
    difficulty: "Intermedio",
    duration: "18 min",
    format: "Video",
    focus: ["Setups con Flicker", "Control de movilidad", "Ventanas de visión"],
    summary:
      "Ruta completa desde fase 1: cuándo guardar Bouncing Ball, cómo negar dashes y timings para invadir con tu jungla.",
    url: "https://youtu.be/codevamp-khufra",
    lastUpdate: "2024-03-21",
  },
  {
    hero: "Lancelot",
    role: "Assassin",
    lane: "Jungla",
    difficulty: "Avanzado",
    duration: "24 min",
    format: "Video",
    focus: ["Resets de Thorned Rose", "Rutas de limpieza", "Macro agresivo"],
    summary:
      "Practica rutas de doble cangrejo y aprende a forzar pick-offs con frames exactos para Phantom Execution defensivo.",
    url: "https://youtu.be/codevamp-lancelot",
    lastUpdate: "2024-02-27",
  },
  {
    hero: "Pharsa",
    role: "Mage",
    lane: "Mid",
    difficulty: "Iniciación",
    duration: "12 min",
    format: "Checklist",
    focus: ["Rotaciones con ala", "Control de visión", "Timing de ultimate"],
    summary:
      "Lista de chequeo previa a scrims para asegurar wave management y posicionamiento óptimo con Feathered Air Strike.",
    url: "https://docs.codevamp.com/mlbb/pharsa-checklist",
    lastUpdate: "2024-01-16",
  },
  {
    hero: "Beatrix",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Avanzado",
    duration: "30 min",
    format: "Sesión en vivo",
    focus: ["Cambios de arma", "Flicker + Nibiru", "Coberturas defensivas"],
    summary:
      "Masterclass grabada con sparrings donde se practican swaps rápidos entre Renner y Bennett para peleas extendidas.",
    url: "https://live.codevamp.com/vods/beatrix-masterclass",
    lastUpdate: "2024-03-02",
  },
  {
    hero: "Estes",
    role: "Support",
    lane: "Roam",
    difficulty: "Iniciación",
    duration: "9 min",
    format: "PDF",
    focus: ["Trayectorias de curación", "Gestión de mana", "Uso reactivo de ultimate"],
    summary:
      "Guía descargable con diagramas de posicionamiento y builds de soporte para diferentes composiciones front-to-back.",
    url: "https://docs.codevamp.com/mlbb/estes-support",
    lastUpdate: "2023-12-11",
  },
  {
    hero: "Yve",
    role: "Mage",
    lane: "Mid",
    difficulty: "Intermedio",
    duration: "21 min",
    format: "Video",
    focus: ["Control de zonas", "Starfield defensivo", "Combos con tanque"],
    summary:
      "Explicación paso a paso de patrones de Starfield y cómo combinarlo con engages de Atlas y Khufra en choke points.",
    url: "https://youtu.be/codevamp-yve",
    lastUpdate: "2024-03-18",
  },
];
