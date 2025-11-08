import type { MlbbDraftAgent } from "@shared/mobile-legends/types";

export const mlbbDraftAgent: MlbbDraftAgent = {
  version: "2024.04",
  updatedAt: "abril 2024",
  latestItem: {
    name: "Pauldron de Castigo",
    description:
      "Ítem defensivo con activación de castigo que potencia a tanques iniciadores. Escala con vida adicional y aporta mitigación explosiva al entrar.",
    recommendedFor: ["Khufra", "Atlas", "Tigreal", "Fredrinn"],
    timing: "Prioriza después del primer ítem de utilidad o cuando el draft enemigo tenga burst físico dominante.",
  },
  bans: [
    {
      hero: "Novaria",
      priority: "Alta",
      reason: "Control de mapa global y burst impredecible. Niega espacio a composiciones lentas.",
    },
    {
      hero: "Valentina",
      priority: "Alta",
      reason: "Copia definitivas claves y castiga drafts de CC encadenado.",
    },
    {
      hero: "Joy",
      priority: "Media",
      reason: "Movilidad extrema y daño sostenido que exige counters específicos.",
    },
    {
      hero: "Arlott",
      priority: "Media",
      reason: "Frontline flexible con gran control y pick-off en peleas cerradas.",
    },
    {
      hero: "Fanny",
      priority: "Situacional",
      reason: "Solo banear si no tienes counter de movilidad y visión coordinada.",
    },
  ],
  priorityPicks: [
    {
      role: "Roam",
      headline: "Iniciadores con control prolongado",
      heroes: ["Khufra", "Atlas", "Akai"],
      plan: "Asegura engages limpios y crea espacio para tiradores de escalado. Combina con magos de control de zona.",
    },
    {
      role: "Jungla",
      headline: "Asesinos con presión temprana",
      heroes: ["Lancelot", "Martis", "Fredrinn"],
      plan: "Invade cuando tengas prioridad lateral y sincroniza objetivos con rotaciones de mid.",
    },
    {
      role: "Gold",
      headline: "Tiradores anti-frontline",
      heroes: ["Brody", "Karrie", "Beatrix"],
      plan: "Llega al segundo ítem rápido y mueve la pelea a tortuga/lord con peel asegurado.",
    },
    {
      role: "EXP",
      headline: "Flex picks con flanqueo",
      heroes: ["Yu Zhong", "Paquito", "Joy"],
      plan: "Controla oleadas, busca ángulos de TP y flanquea backlines cuando tus supports puedan seguirte.",
    },
    {
      role: "Mid",
      headline: "Control de zona y waveclear",
      heroes: ["Yve", "Pharsa", "Lylia"],
      plan: "Domina mid con waveclear rápido y habilita rotaciones a objetivos neutrales.",
    },
  ],
  builds: [
    {
      hero: "Khufra",
      coreItems: ["Botas Resilientes", "Pauldron de Castigo", "Cinturón del Guardián"],
      situationalItems: ["Yelmo del Guardián", "Dominance Ice", "Inmortalidad"],
      notes: "Usa el activo de Pauldron para castigar engages y extender el control durante Bouncing Ball.",
    },
    {
      hero: "Brody",
      coreItems: ["Espada del Mar", "Malefic Roar", "Corazón Carmesí"],
      situationalItems: ["Cuchilla del Desesperado", "Rose Gold Meteor", "Inmortalidad"],
      notes: "Sincroniza el pico de daño con objetivo neutro. No olvides rotar tras segundo ítem.",
    },
    {
      hero: "Lancelot",
      coreItems: ["Calamity Reaper", "Cuchilla del Desesperado", "Cuchilla de la Selva"],
      situationalItems: ["Inmortalidad", "Bloodlust Axe", "Athena's Shield"],
      notes: "Aprovecha ventanas de invulnerabilidad y coordina flancos con tu roamer.",
    },
    {
      hero: "Yve",
      coreItems: ["Reloj del Destino", "Lightning Truncheon", "Crystalline Pauldron"],
      situationalItems: ["Winter Truncheon", "Necklace of Durance", "Genius Wand"],
      notes: "Mantén zona controlada y guarda el ultimate para objetivos neutrales.",
    },
  ],
  notes: [
    "Prioriza comunicación constante: comparte timers de objetivos y parpadeos enemigos.",
    "Evalúa composición rival tras cada ban para ajustar el orden de prioridad.",
    "El agente resume tendencias del laboratorio y scrims recientes; úsalo como guía, no como regla rígida.",
  ],
};
