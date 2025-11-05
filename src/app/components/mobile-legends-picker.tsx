"use client";

import { useEffect, useMemo, useState } from "react";

import { heroBaseRecords } from "@/app/data/mobile-legends-heroes";

type EnemyTrait =
  | "burst"
  | "sustain"
  | "mobility"
  | "crowd-control"
  | "poke"
  | "split-push";

type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";

type Lane = "Gold" | "EXP" | "Mid" | "Jungle" | "Roam";

type HeroMetrics = {
  survivability: number;
  damageSpike: number;
  objectiveControl: number;
  teamUtility: number;
  scaling: number;
};

type HeroCosts = {
  battlePoints?: number;
  diamonds?: number;
  tickets?: number;
  heroFragments?: number;
  luckyGems?: number;
};

type Hero = {
  name: string;
  title: string;
  role: HeroRole;
  lane: Lane;
  difficulty: "Baja" | "Media" | "Alta";
  specialties: string[];
  counters: EnemyTrait[];
  countersHeroes: string[];
  synergyHeroes: string[];
  synergy: string;
  playPattern: string;
  macroFocus: string;
  metrics: HeroMetrics;
  faction: string;
  release: string;
  costs: HeroCosts;
};

const enemyTraits: { id: EnemyTrait; label: string; description: string }[] = [
  { id: "burst", label: "Daño explosivo", description: "Magos o asesinos con combos rápidos" },
  { id: "sustain", label: "Mucha curación", description: "Composiciones con soporte y regeneración" },
  { id: "mobility", label: "Alta movilidad", description: "Héroes con muchos dashes o escapes" },
  { id: "crowd-control", label: "Mucho CC", description: "Control constante como stuns o slows" },
  { id: "poke", label: "Poke a distancia", description: "Daño constante desde lejos" },
  { id: "split-push", label: "Split push", description: "Presión en líneas laterales" },
];

const roleDifficultyDefaults: Record<HeroRole, Hero["difficulty"]> = {
  Tank: "Baja",
  Fighter: "Media",
  Assassin: "Alta",
  Mage: "Media",
  Marksman: "Media",
  Support: "Baja",
};

const roleMetricDefaults: Record<HeroRole, HeroMetrics> = {
  Tank: { survivability: 5, damageSpike: 2, objectiveControl: 3, teamUtility: 5, scaling: 3 },
  Fighter: { survivability: 4, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 3 },
  Assassin: { survivability: 2, damageSpike: 5, objectiveControl: 3, teamUtility: 2, scaling: 3 },
  Mage: { survivability: 2, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  Marksman: { survivability: 2, damageSpike: 4, objectiveControl: 3, teamUtility: 2, scaling: 5 },
  Support: { survivability: 3, damageSpike: 2, objectiveControl: 3, teamUtility: 5, scaling: 3 },
};

const specialtyTraitMapping: Array<{ keyword: string; traits: EnemyTrait[] }> = [
  { keyword: "burst", traits: ["sustain"] },
  { keyword: "finisher", traits: ["sustain"] },
  { keyword: "damage", traits: ["sustain"] },
  { keyword: "magic damage", traits: ["sustain"] },
  { keyword: "true damage", traits: ["sustain"] },
  { keyword: "chase", traits: ["poke"] },
  { keyword: "charge", traits: ["poke"] },
  { keyword: "mobility", traits: ["crowd-control"] },
  { keyword: "crowd control", traits: ["mobility", "crowd-control"] },
  { keyword: "control", traits: ["mobility"] },
  { keyword: "poke", traits: ["sustain", "poke"] },
  { keyword: "regen", traits: ["poke"] },
  { keyword: "guard", traits: ["mobility"] },
  { keyword: "support", traits: ["mobility"] },
  { keyword: "push", traits: ["split-push"] },
  { keyword: "split", traits: ["split-push"] },
  { keyword: "initiator", traits: ["crowd-control"] },
];

const roleFallbackTraits: Record<HeroRole, EnemyTrait[]> = {
  Tank: ["mobility", "crowd-control"],
  Fighter: ["split-push"],
  Assassin: ["poke"],
  Mage: ["sustain"],
  Marksman: ["sustain"],
  Support: ["crowd-control"],
};

const laneSynergyPresets: Record<Lane, string[]> = {
  Gold: ["Lolita", "Diggie", "Estes", "Angela"],
  EXP: ["Khufra", "Atlas", "Barats", "Fredrinn"],
  Mid: ["Khufra", "Atlas", "Tigreal", "Lolita"],
  Jungle: ["Diggie", "Angela", "Mathilda", "Khufra"],
  Roam: ["Brody", "Beatrix", "Claude", "Wanwan"],
};

const laneCounterPresets: Record<Lane, string[]> = {
  Gold: ["Khufra", "Atlas", "Tigreal", "Baxia"],
  EXP: ["Esmeralda", "Yu Zhong", "Paquito", "Terizla"],
  Mid: ["Kadita", "Gusion", "Hayabusa", "Lylia"],
  Jungle: ["Khufra", "Atlas", "Akai", "Baxia"],
  Roam: ["Fanny", "Ling", "Lancelot", "Aamon"],
};

const laneLabelsForNarrative: Record<Lane, string> = {
  Gold: "línea de oro",
  EXP: "línea EXP",
  Mid: "línea central",
  Jungle: "jungla",
  Roam: "roaming",
};

const lanePlayTemplates: Record<Lane, string> = {
  Gold: "Administra la oleada en la {lane} y castiga con {specialty}.",
  EXP: "Domina el duelo en la {lane}, forzando intercambios cuando puedas aprovechar {specialty}.",
  Mid: "Controla la wave en la {lane} y presiona con {specialty} mientras rotas.",
  Jungle: "Ruta eficientemente por la {lane} e invade cuando tus líneas puedan seguirte gracias a {specialty}.",
  Roam: "Mantén visión y habilita engages desde el {lane}, iniciando con {specialty}.",
};

const laneMacroTemplates: Record<Lane, string> = {
  Gold: "Tras asegurar la primera torre rota al carril central y participa en Tortuga y Lord.",
  EXP: "Cuando empujes la oleada busca flancos y colapsos en objetivos mayores.",
  Mid: "Coordina con tu jungla para dominar Tortuga y controlar visión en el río.",
  Jungle: "Administra los tiempos de campamentos e invade con prioridad de líneas para asegurar cada objetivo neutral.",
  Roam: "Coloca visión en arbustos críticos, protege a tu tirador y acompaña cada objetivo neutral.",
};

const laneSynergySnippets: Record<Lane, string> = {
  Gold: "Agradece roamers que puedan protegerte y extender peleas front-to-back.",
  EXP: "Coordina con tu jungla para convertir la presión lateral en objetivos neutrales.",
  Mid: "Necesita compañeros que fijen objetivos mientras tu daño llega desde seguro.",
  Jungle: "Funciona mejor cuando las líneas adyacentes ceden prioridad para invadir contigo.",
  Roam: "Potencia a tus carries aportándoles control y peel constante.",
};

const roleSynergySnippets: Record<HeroRole, string> = {
  Tank: "Brilla iniciando peleas y absorbiendo recursos enemigos",
  Fighter: "Aporta presión lateral constante y daño sostenido",
  Assassin: "Exige información y control aliados para entrar limpio",
  Mage: "Controla zonas y castiga agrupaciones enemigas",
  Marksman: "Escala con protección consistente y visión clara",
  Support: "Refuerza a los carries con utilidad y mitigación constante",
};

const roleMacroSuffix: Record<HeroRole, string> = {
  Tank: "Abre peleas y ofrece visión ofensiva",
  Fighter: "Transforma tu ventaja lateral en torres y presión de mapa",
  Assassin: "Busca pick-offs que allanen el camino para objetivos neutrales",
  Mage: "Mantén zonas controladas para que tu equipo ejecute con seguridad",
  Marksman: "Mantente a salvo detrás de tu frontline para aportar DPS constante",
  Support: "Mantén con vida a tus amenazas mientras controlas el ritmo de la pelea",
};

const rolePlayOpeners: Record<HeroRole, string> = {
  Tank: "Inicia combates cuando veas al objetivo clave vulnerable",
  Fighter: "Controla los duelos de línea para generar ventaja",
  Assassin: "Espera ventanas cortas para entrar, burstear y reposicionarte",
  Mage: "Mantén la presión de habilidades y castiga desde la distancia",
  Marksman: "Gestiona tu posicionamiento para infligir DPS seguro",
  Support: "Mantente junto al objetivo prioritario y responde con utilidad",
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toHeroRole(primaryRole: string): HeroRole {
  const raw = normalizeWhitespace(primaryRole).split("/")[0].trim().toLowerCase();
  if (raw.includes("tank")) return "Tank";
  if (raw.includes("fighter")) return "Fighter";
  if (raw.includes("assassin")) return "Assassin";
  if (raw.includes("mage")) return "Mage";
  if (raw.includes("marksman")) return "Marksman";
  return "Support";
}

function toLane(lane: string): Lane {
  const primary = normalizeWhitespace(lane).split("/")[0].trim().toLowerCase();
  if (primary.includes("gold")) return "Gold";
  if (primary.includes("exp")) return "EXP";
  if (primary.includes("mid")) return "Mid";
  if (primary.includes("jungle")) return "Jungle";
  return "Roam";
}

function parseSpecialties(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("/")
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .map((part) => part.replace(/^./, (char) => char.toUpperCase()));
}

function deriveCounters(role: HeroRole, specialties: string[]): EnemyTrait[] {
  const traits = new Set<EnemyTrait>();
  specialties.forEach((specialty) => {
    const lower = specialty.toLowerCase();
    specialtyTraitMapping.forEach(({ keyword, traits: mappedTraits }) => {
      if (lower.includes(keyword)) {
        mappedTraits.forEach((trait) => traits.add(trait));
      }
    });
  });
  if (traits.size === 0) {
    roleFallbackTraits[role].forEach((trait) => traits.add(trait));
  }
  return Array.from(traits);
}

function deriveHeroList(options: string[], heroName: string): string[] {
  const current = new Set<string>();
  const self = heroName.toLowerCase();
  options.forEach((candidate) => {
    if (!candidate) return;
    if (candidate.toLowerCase() === self) return;
    if (!current.has(candidate)) {
      current.add(candidate);
    }
  });
  return Array.from(current).slice(0, 4);
}

function buildSynergy(role: HeroRole, lane: Lane, specialties: string[]): string {
  const laneLabel = laneLabelsForNarrative[lane];
  const specialty = specialties[0]?.toLowerCase() ?? "utilidad";
  return `${roleSynergySnippets[role]} desde la ${laneLabel}, maximizando ${specialty}. ${laneSynergySnippets[lane]}`;
}

function buildPlayPattern(role: HeroRole, lane: Lane, specialties: string[]): string {
  const laneLabel = laneLabelsForNarrative[lane];
  const specialty = specialties.length > 0
    ? specialties.slice(0, 2).map((item) => item.toLowerCase()).join(" y ")
    : "tu kit";
  const base = lanePlayTemplates[lane]
    .replace("{lane}", laneLabel)
    .replace("{specialty}", specialty);
  return `${rolePlayOpeners[role]}. ${base}`;
}

function buildMacroFocus(role: HeroRole, lane: Lane): string {
  return `${laneMacroTemplates[lane]} ${roleMacroSuffix[role]}.`;
}

type HeroGuideOverride = Partial<Omit<Hero, "name" | "title" | "faction" | "release" | "costs">> & {
  role?: HeroRole;
  lane?: Lane;
};

const heroGuideOverrides: Record<string, HeroGuideOverride> = {
  "Khufra": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Iniciación`, `Anti-dash`],
    counters: [`mobility`, `crowd-control`],
    countersHeroes: [`Fanny`, `Lancelot`, `Ling`, `Claude`],
    synergyHeroes: [`Pharsa`, `Yve`, `Lylia`, `Brody`],
    synergy: `Caza asesinos móviles y permite que tus magos canalicen daño a salvo.`,
    playPattern: `Marca al jungla enemigo, corta dashes con Bouncing Ball y fuerza Tyrant's Rage sobre objetivos clave.`,
    macroFocus: `Asegura visión alrededor de tortuga y lord, zonificando entradas con tu cuerpo y control.`,
    metrics: { survivability: 5, damageSpike: 3, objectiveControl: 4, teamUtility: 5, scaling: 3 },
  },
  "Lolita": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Baja`,
    specialties: [`Bloqueo de proyectiles`, `Shield`],
    counters: [`poke`, `crowd-control`],
    countersHeroes: [`Beatrix`, `Brody`, `Claude`, `Pharsa`],
    synergyHeroes: [`Brody`, `Beatrix`, `Claude`, `Wanwan`],
    synergy: `Protege tiradores estáticos y devuelve daño masivo con el Noumenon Blast.`,
    playPattern: `Mantén cargado el escudo para negar poke y castiga engages con flicker + ultimate sorpresivo.`,
    macroFocus: `Juega alrededor de tu tirador: rota temprano a Gold y acompaña inicios de objetivos mayores.`,
    metrics: { survivability: 4, damageSpike: 3, objectiveControl: 4, teamUtility: 5, scaling: 4 },
  },
  "Martis": {
    role: `Fighter`,
    lane: `EXP`,
    difficulty: `Media`,
    specialties: [`Anti-CC`, `Snowball`],
    counters: [`crowd-control`, `split-push`],
    countersHeroes: [`Fredrinn`, `Tigreal`, `Atlas`, `Esmeralda`],
    synergyHeroes: [`Lancelot`, `Pharsa`, `Yve`, `Claude`],
    synergy: `Se mantiene en pelea prolongada y remata objetivos con su ultimate.`,
    playPattern: `Spamea Mortal Coil para reposicionarte, cancela controles y remata con Decimation en ejecuciones seguras.`,
    macroFocus: `Empuja side lane tras ganar presión y rota al mid con ventaja de vida para forzar objetivos.`,
    metrics: { survivability: 4, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
  "Paquito": {
    role: `Fighter`,
    lane: `EXP`,
    difficulty: `Alta`,
    specialties: [`Burst`, `Movilidad`],
    counters: [`burst`, `mobility`],
    countersHeroes: [`Martis`, `Esmeralda`, `Benedetta`, `Fredrinn`],
    synergyHeroes: [`Lancelot`, `Angela`, `Diggie`],
    synergy: `Castiga frontales blandos y mantiene presión constante en side lanes.`,
    playPattern: `Acumula stacks con combos cortos y entra con Knockout Strike cuando puedas forzar 100% del burst.`,
    macroFocus: `Desplaza la pelea a tu línea tras limpiar oleadas y busca flanquear por la retaguardia en teamfights.`,
    metrics: { survivability: 3, damageSpike: 5, objectiveControl: 3, teamUtility: 2, scaling: 4 },
  },
  "Lancelot": {
    role: `Assassin`,
    lane: `Jungle`,
    difficulty: `Alta`,
    specialties: [`Desplazamientos`, `Invulnerabilidad`],
    counters: [`sustain`, `poke`],
    countersHeroes: [`Estes`, `Esmeralda`, `Brody`, `Wanwan`],
    synergyHeroes: [`Diggie`, `Angela`, `Khufra`, `Atlas`],
    synergy: `Aprovecha gaps creados por tu roamer para eliminar backline de un combo.`,
    playPattern: `Resetea Thorned Rose tras cada dash, invade cuando tengas púas disponibles y guarda Phantom Execution defensivo.`,
    macroFocus: `Mantén presión en campamentos enemigos y forzad pick-offs antes de cada objetivo neutral.`,
    metrics: { survivability: 3, damageSpike: 5, objectiveControl: 4, teamUtility: 3, scaling: 3 },
  },
  "Fanny": {
    role: `Assassin`,
    lane: `Jungle`,
    difficulty: `Alta`,
    specialties: [`Movilidad extrema`, `Pick-off`],
    counters: [`split-push`, `poke`],
    countersHeroes: [`Beatrix`, `Claude`, `Ling`, `Wanwan`],
    synergyHeroes: [`Lolita`, `Diggie`, `Angela`],
    synergy: `Domina cielos abiertos cuando tu equipo controla visión y energías.`,
    playPattern: `Traza rutas dobles para entrar y salir, administra energía con kills rápidas y evita zonas con CC pesado.`,
    macroFocus: `Divide el mapa presionando líneas abiertas y cierra peleas antes de quedarte sin recursos.`,
    metrics: { survivability: 2, damageSpike: 5, objectiveControl: 3, teamUtility: 2, scaling: 3 },
  },
  "Ling": {
    role: `Assassin`,
    lane: `Jungle`,
    difficulty: `Alta`,
    specialties: [`Split push`, `Reinicios`],
    counters: [`split-push`, `poke`],
    countersHeroes: [`Beatrix`, `Yve`, `Lylia`, `Claude`],
    synergyHeroes: [`Diggie`, `Khufra`, `Angela`],
    synergy: `Divide el mapa y fuerza errores con llegadas inesperadas desde los muros.`,
    playPattern: `Permanece en muros para cargar energía, cae sobre backline y usa Tempest of Blades para reposicionarte.`,
    macroFocus: `Mantén oleadas laterales avanzadas y busca steals o picks cuando el enemigo rota mal.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 4, teamUtility: 2, scaling: 4 },
  },
  "Lylia": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Media`,
    specialties: [`Burst`, `Escape`],
    counters: [`crowd-control`, `poke`],
    countersHeroes: [`Valentina`, `Esmeralda`, `Martis`, `Claude`],
    synergyHeroes: [`Khufra`, `Atlas`, `Tigreal`, `Brody`],
    synergy: `Empuja líneas rápido y habilita rotaciones agresivas.`,
    playPattern: `Coloca sombras para zonas seguras, limpia wave con Bombs y reserva Black Shoes como botón de reset.`,
    macroFocus: `Presiona mid constantemente y acompaña al jungla en invasiones con movilidad disponible.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 3 },
  },
  "Yve": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Alta`,
    specialties: [`Zona`, `Control`],
    counters: [`mobility`, `split-push`],
    countersHeroes: [`Ling`, `Fanny`, `Gusion`, `Benedetta`],
    synergyHeroes: [`Khufra`, `Atlas`, `Tigreal`, `Martis`],
    synergy: `Controla teamfights largas con su Starfield y pokea a distancia.`,
    playPattern: `Configura Starfield en choke points y alterna líneas y explosiones para mantener a raya engages.`,
    macroFocus: `Acompaña a tu roamer para colocar visión y controla objetivos forzando peleas en zonas cerradas.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 4, teamUtility: 4, scaling: 4 },
  },
  "Pharsa": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Media`,
    specialties: [`Rango`, `Daño en área`],
    counters: [`split-push`, `poke`],
    countersHeroes: [`Claude`, `Wanwan`, `Brody`, `Valentina`],
    synergyHeroes: [`Khufra`, `Atlas`, `Diggie`],
    synergy: `Castiga posiciones malas con ultimate global y disuade engages.`,
    playPattern: `Abusa de la forma de ave para rotar, inicia Feathered Air Strike desde fog y remata con burst distante.`,
    macroFocus: `Juega alrededor de mid y oro, usando la ultimate para defender o castigar objetivos neutrales.`,
    metrics: { survivability: 2, damageSpike: 4, objectiveControl: 4, teamUtility: 3, scaling: 3 },
  },
  "Brody": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Media`,
    specialties: [`Burst`, `Escalado`],
    counters: [`mobility`, `crowd-control`],
    countersHeroes: [`Wanwan`, `Claude`, `Esmeralda`, `Gusion`],
    synergyHeroes: [`Lolita`, `Diggie`, `Khufra`],
    synergy: `Pega fuerte en mid game y castiga engages prematuros.`,
    playPattern: `Abusa de combos básicos + skill 1, controla distancias con stun y busca ultimate cuando tengas 4 marcas.`,
    macroFocus: `Prioriza la primera torre de Oro, rota al mid tras minuto 8 para derrumbar estructuras con tu burst.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 2, scaling: 4 },
  },
  "Beatrix": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Alta`,
    specialties: [`Flexibilidad`, `Rango`],
    counters: [`poke`, `split-push`],
    countersHeroes: [`Brody`, `Claude`, `Wanwan`, `Esmeralda`],
    synergyHeroes: [`Lolita`, `Diggie`, `Estes`, `Claude`],
    synergy: `Adapta armas según la composición y aporta burst desde lejos.`,
    playPattern: `Alterna armas para limpiar wave segura y ejecuta combos Nibiru + Renner para objetivos clave.`,
    macroFocus: `Mantén control de la línea de oro y rota con Renner para amenazar snipes en teamfights.`,
    metrics: { survivability: 2, damageSpike: 5, objectiveControl: 3, teamUtility: 2, scaling: 4 },
  },
  "Claude": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Alta`,
    specialties: [`Escalado`, `Movilidad`],
    counters: [`sustain`, `split-push`],
    countersHeroes: [`Estes`, `Esmeralda`, `Brody`, `Diggie`],
    synergyHeroes: [`Angela`, `Diggie`, `Khufra`],
    synergy: `Se potencia con peel y control, explotando con su Blazing Duet.`,
    playPattern: `Gestiona stacks con Art of Thievery, limpia rápido y entra con Blazing Duet tras un buen control aliado.`,
    macroFocus: `Farmea hasta ítems clave y busca colapsos coordinados sobre la backline con movilidad de Battle Mirror.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 5 },
  },
  "Wanwan": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Alta`,
    specialties: [`Movilidad`, `True damage`],
    counters: [`sustain`, `split-push`],
    countersHeroes: [`Esmeralda`, `Fredrinn`, `Tigreal`, `Atlas`],
    synergyHeroes: [`Diggie`, `Lolita`, `Estes`],
    synergy: `Rompe frontales cuando tu equipo puede revelar y marcar objetivos.`,
    playPattern: `Marca a enemigos con ataques básicos, activa ultimate tras romper debilidades y usa crossbow para limpiar.`,
    macroFocus: `Mantén visión de flancos, espera controles aliados y utiliza tu movilidad para rematar objetivos extendidos.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 2, scaling: 5 },
  },
  "Estes": {
    role: `Support`,
    lane: `Roam`,
    difficulty: `Baja`,
    specialties: [`Curación`, `Sostenimiento`],
    counters: [`poke`, `split-push`],
    countersHeroes: [`Lancelot`, `Ling`, `Gusion`, `Fanny`],
    synergyHeroes: [`Brody`, `Beatrix`, `Wanwan`, `Claude`],
    synergy: `Brilla en composiciones de teamfight 5v5 y front to back.`,
    playPattern: `Mantén lazos activos sobre tu tirador, usa ultimate para contrarrestar engages y coloca slow fields.`,
    macroFocus: `Reúne al equipo en objetivos mayores y evita que se separen demasiado de tu aura de curación.`,
    metrics: { survivability: 4, damageSpike: 2, objectiveControl: 3, teamUtility: 5, scaling: 4 },
  },
  "Diggie": {
    role: `Support`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Anti-CC`, `Utilidad`],
    counters: [`crowd-control`, `burst`],
    countersHeroes: [`Khufra`, `Atlas`, `Tigreal`, `Gusion`],
    synergyHeroes: [`Lancelot`, `Claude`, `Fanny`, `Wanwan`],
    synergy: `Neutraliza lockdown y otorga libertad a asesinos y tiradores.`,
    playPattern: `Molesta con bombas, guarda Time Journey para negar ultimates clave y protege rutas de escape.`,
    macroFocus: `Acompaña rotaciones agresivas y mantén control de visión con bombas en arbustos críticos.`,
    metrics: { survivability: 3, damageSpike: 2, objectiveControl: 3, teamUtility: 5, scaling: 4 },
  },
  "Atlas": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Wombo combo`, `Control`],
    counters: [`crowd-control`, `mobility`],
    countersHeroes: [`Brody`, `Claude`, `Wanwan`, `Paquito`],
    synergyHeroes: [`Yve`, `Pharsa`, `Lylia`, `Claude`],
    synergy: `Engage letal cuando tu equipo sigue con daño en área.`,
    playPattern: `Abusa de Perfect Match para entrar, recoge con Fatal Links y combina con flicker para arrastrar múltiples objetivos.`,
    macroFocus: `Coordina engages en espacios cerrados y fuerza purificaciones antes de objetivos críticos.`,
    metrics: { survivability: 4, damageSpike: 3, objectiveControl: 4, teamUtility: 5, scaling: 3 },
  },
  "Tigreal": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Baja`,
    specialties: [`Control`, `Iniciación`],
    counters: [`mobility`, `burst`],
    countersHeroes: [`Gusion`, `Fanny`, `Lancelot`, `Ling`],
    synergyHeroes: [`Yve`, `Pharsa`, `Brody`, `Wanwan`],
    synergy: `Encadena combos sencillos con flicker que cambian peleas.`,
    playPattern: `Engagea con Sacred Hammer + Implosion tras limpiar visión y guarda flicker para sorprender.`,
    macroFocus: `Forma front to back, protege a tus carries y controla entradas a objetivos con tu cuerpo.`,
    metrics: { survivability: 4, damageSpike: 2, objectiveControl: 3, teamUtility: 4, scaling: 3 },
  },
  "Angela": {
    role: `Support`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Aceleración`, `Escudos`],
    counters: [`burst`, `mobility`],
    countersHeroes: [`Lancelot`, `Gusion`, `Paquito`, `Benedetta`],
    synergyHeroes: [`Lancelot`, `Ling`, `Claude`, `Wanwan`],
    synergy: `Potencia asesinos hyper con sus buffs y ultimate global.`,
    playPattern: `Mantente cerca de tu carry principal, carga corazones y usa ultimate reactiva para potenciar engages.`,
    macroFocus: `Sincroniza tus rotaciones con el jungla y asegura que siempre tengas objetivo para montar.`,
    metrics: { survivability: 3, damageSpike: 2, objectiveControl: 3, teamUtility: 5, scaling: 4 },
  },
  "Esmeralda": {
    role: `Fighter`,
    lane: `EXP`,
    difficulty: `Media`,
    specialties: [`Robo de escudos`, `Sostenimiento`],
    counters: [`sustain`, `burst`],
    countersHeroes: [`Estes`, `Angela`, `Pharsa`, `Yve`],
    synergyHeroes: [`Diggie`, `Claude`, `Brody`],
    synergy: `Robusta en peleas largas con escudos casi infinitos.`,
    playPattern: `Alterna absorción de escudos con movilidad constante y entra cuando puedas robar barreras enemigas.`,
    macroFocus: `Mantén presión lateral y corta oleadas para forzar respuestas mientras preparas flancos.`,
    metrics: { survivability: 5, damageSpike: 3, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
  "Benedetta": {
    role: `Assassin`,
    lane: `EXP`,
    difficulty: `Alta`,
    specialties: [`Escape`, `Sidelane`],
    counters: [`split-push`, `mobility`],
    countersHeroes: [`Paquito`, `Martis`, `Esmeralda`, `Brody`],
    synergyHeroes: [`Lancelot`, `Ling`, `Angela`],
    synergy: `Presiona líneas y aporta control inesperado en peleas.`,
    playPattern: `Carga espadas moviéndote, limpia wave con combos rápidos y busca stuns sorpresivos con Alecto.`,
    macroFocus: `Juega a los flancos, divide mapa y conecta con tu equipo cuando hayas empujado profundo.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 2, scaling: 4 },
  },
  "Gusion": {
    role: `Assassin`,
    lane: `Jungle`,
    difficulty: `Alta`,
    specialties: [`Burst`, `Explosión`],
    counters: [`sustain`, `poke`],
    countersHeroes: [`Estes`, `Pharsa`, `Yve`, `Lylia`],
    synergyHeroes: [`Diggie`, `Angela`, `Khufra`],
    synergy: `Explota carries blandos con combos rápidos de dagas.`,
    playPattern: `Encadena dagas y ultimate para burst instantáneo, resetea con Sword Spike para reposicionarte.`,
    macroFocus: `Aprovecha ventanas de ultimate disponible para buscar picks antes de objetivos y resets rápidos.`,
    metrics: { survivability: 2, damageSpike: 5, objectiveControl: 3, teamUtility: 2, scaling: 3 },
  },
  "Valentina": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Alta`,
    specialties: [`Flex`, `Utility`],
    counters: [`crowd-control`, `burst`],
    countersHeroes: [`Lylia`, `Pharsa`, `Yve`, `Tigreal`],
    synergyHeroes: [`Esmeralda`, `Martis`, `Atlas`],
    synergy: `Se adapta al draft enemigo copiando ultimates clave.`,
    playPattern: `Roba ultimate valiosa, juega agresivo con cargas de Shadow Strike y asegura experiencia extra.`,
    macroFocus: `Controla mid, roba campamentos con movilidad y replica engages enemigos a tu favor.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 4, scaling: 4 },
  },
  "Fredrinn": {
    role: `Tank`,
    lane: `EXP`,
    difficulty: `Media`,
    specialties: [`Sostenimiento`, `Counter engage`],
    counters: [`burst`, `crowd-control`],
    countersHeroes: [`Lancelot`, `Gusion`, `Fanny`, `Ling`],
    synergyHeroes: [`Yve`, `Pharsa`, `Brody`],
    synergy: `Genera espacio absorbiendo daño y devolviendo control.`,
    playPattern: `Acumula combos con energía, usa taunts para frenar engages y remata con energía máxima.`,
    macroFocus: `Toma presión en línea, rota lentamente con tu jungla y absorbe recursos enemigos en peleas largas.`,
    metrics: { survivability: 5, damageSpike: 3, objectiveControl: 4, teamUtility: 4, scaling: 4 },
  },
  "Akai": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Desplazamiento`, `Control`],
    counters: [`mobility`, `split-push`],
    countersHeroes: [`Ling`, `Fanny`, `Benedetta`, `Aamon`],
    synergyHeroes: [`Yve`, `Pharsa`, `Claude`, `Brody`],
    synergy: `Encierra objetivos clave y separa al carry enemigo con su ultimate.`,
    playPattern: `Usa Thousand Pounder para iniciar, activa Heavy Spin para aislar y empuja hacia tu equipo.`,
    macroFocus: `Controla zonas estrechas en tortuga y lord, negando flancos con tu definitiva.`,
    metrics: { survivability: 4, damageSpike: 2, objectiveControl: 5, teamUtility: 5, scaling: 3 },
  },
  "Baxia": {
    role: `Tank`,
    lane: `Roam`,
    difficulty: `Media`,
    specialties: [`Anti-curación`, `Rotaciones`],
    counters: [`sustain`, `split-push`],
    countersHeroes: [`Esmeralda`, `Estes`, `Uranus`, `Alice`],
    synergyHeroes: [`Lylia`, `Pharsa`, `Lancelot`, `Joy`],
    synergy: `Reduce curaciones enemigas mientras persigue con gran movilidad.`,
    playPattern: `Activa Baxia Mark, rueda para entrar y mantente encima del objetivo para aplicar reducción de curación.`,
    macroFocus: `Traza rutas profundas con tus rodamientos para forzar respuestas y cortar la retaguardia.`,
    metrics: { survivability: 4, damageSpike: 3, objectiveControl: 4, teamUtility: 4, scaling: 3 },
  },
  "Joy": {
    role: `Assassin`,
    lane: `EXP`,
    difficulty: `Alta`,
    specialties: [`Inmunidad`, `Movilidad`],
    counters: [`crowd-control`, `burst`],
    countersHeroes: [`Kadita`, `Yve`, `Lylia`, `Pharsa`],
    synergyHeroes: [`Diggie`, `Angela`, `Claude`, `Lancelot`],
    synergy: `Danza alrededor de controles y castiga backlines con ritmo constante.`,
    playPattern: `Mantén el tempo con saltos perfectos, entra cuando tengas ritmo completo y remata con ultimate extendido.`,
    macroFocus: `Crea presión lateral y busca picks rápidos antes de objetivos neutrales.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
  "Guinevere": {
    role: `Fighter`,
    lane: `EXP`,
    difficulty: `Media`,
    specialties: [`Airborne`, `Burst`],
    counters: [`burst`, `mobility`],
    countersHeroes: [`Paquito`, `Yu Zhong`, `Chou`, `Aamon`],
    synergyHeroes: [`Lylia`, `Pharsa`, `Claude`, `Atlas`],
    synergy: `Levanta a varios enemigos para combos en área devastadores.`,
    playPattern: `Prepara Esferas, busca engages con Violet Requiem y encadena con control aéreo.`,
    macroFocus: `Flanquea por arbustos cerrados y guarda ultimate para forzar recursos clave.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 3 },
  },
  "Hayabusa": {
    role: `Assassin`,
    lane: `Jungle`,
    difficulty: `Alta`,
    specialties: [`Split push`, `Pick-off`],
    counters: [`split-push`, `sustain`],
    countersHeroes: [`Claude`, `Beatrix`, `Pharsa`, `Harith`],
    synergyHeroes: [`Diggie`, `Angela`, `Chou`, `Khufra`],
    synergy: `Elimina tiradores aislados y mantiene presión lateral constante.`,
    playPattern: `Abusa de sombras para entrar y salir, ejecuta Ougi: Shadow Kill sobre objetivos aislados.`,
    macroFocus: `Presiona side lanes y fuerza 4v5 rotando rápidamente entre líneas.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 2, scaling: 4 },
  },
  "Harith": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Alta`,
    specialties: [`Dash`, `Escalado`],
    counters: [`mobility`, `sustain`],
    countersHeroes: [`Valentina`, `Esmeralda`, `Yve`, `Lylia`],
    synergyHeroes: [`Atlas`, `Tigreal`, `Diggie`, `Claude`],
    synergy: `Aprovecha controles aliados para rebotar dentro del Zaman Force.`,
    playPattern: `Coloca Zaman Force, encadena dashes cortos y administra cargas para mantenerte seguro.`,
    macroFocus: `Empuja mid velozmente y rota para pelear alrededor de objetivos con ultimate disponible.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
  "Karrie": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Media`,
    specialties: [`True damage`, `Tanque killer`],
    counters: [`sustain`, `crowd-control`],
    countersHeroes: [`Uranus`, `Gloo`, `Belerick`, `Fredrinn`],
    synergyHeroes: [`Diggie`, `Angela`, `Estes`, `Akai`],
    synergy: `Derretir frontales duros con daño verdadero constante.`,
    playPattern: `Stackea Lightwheel Mark rápidamente y activa ultimate para derretir tanques.`,
    macroFocus: `Llega a power spike de dos ítems y rota a lord para priorizar objetivos prolongados.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 4, teamUtility: 2, scaling: 5 },
  },
  "Moskov": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Media`,
    specialties: [`Perforación`, `Control`],
    counters: [`split-push`, `mobility`],
    countersHeroes: [`Wanwan`, `Ling`, `Fanny`, `Natalia`],
    synergyHeroes: [`Tigreal`, `Atlas`, `Khufra`, `Angela`],
    synergy: `Clava enemigos contra paredes y aporta wave clear veloz.`,
    playPattern: `Aprovecha Spear of Misery para stunear en estructuras, entra con ultimate global para remates.`,
    macroFocus: `Mantén presión constante en oro y rota para limpiar waves profundas con rango extendido.`,
    metrics: { survivability: 3, damageSpike: 4, objectiveControl: 4, teamUtility: 3, scaling: 4 },
  },
  "Natan": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Alta`,
    specialties: [`Reversal`, `Daño híbrido`],
    counters: [`mobility`, `split-push`],
    countersHeroes: [`Ling`, `Benedetta`, `Aamon`, `Hayabusa`],
    synergyHeroes: [`Diggie`, `Mathilda`, `Lolita`, `Estes`],
    synergy: `Escala con daño mixto y control de zonas gracias a su ultimate.`,
    playPattern: `Juega con distancia, posiciona ultimate para kitear hacia atrás y mantener DPS constante.`,
    macroFocus: `Farmea seguro, toma mid tras minuto 10 y coloca clones para defender o asediar.`,
    metrics: { survivability: 2, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 5 },
  },
  "Novaria": {
    role: `Mage`,
    lane: `Mid`,
    difficulty: `Media`,
    specialties: [`Rastreo`, `Burst a distancia`],
    counters: [`poke`, `mobility`],
    countersHeroes: [`Ling`, `Lancelot`, `Harith`, `Joy`],
    synergyHeroes: [`Akai`, `Atlas`, `Tigreal`, `Brody`],
    synergy: `Revela al enemigo y aporta daño desde muy lejos.`,
    playPattern: `Canaliza astros para preparar disparos certeros y revela objetivos clave antes del engage.`,
    macroFocus: `Mantén visión del jungla enemigo y presiona mid sin exponerte gracias a tu rango.`,
    metrics: { survivability: 2, damageSpike: 4, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
  "Popol and Kupa": {
    role: `Marksman`,
    lane: `Gold`,
    difficulty: `Media`,
    specialties: [`Trampas`, `Push`],
    counters: [`split-push`, `mobility`],
    countersHeroes: [`Fanny`, `Ling`, `Hayabusa`, `Balmond`],
    synergyHeroes: [`Diggie`, `Lolita`, `Khufra`, `Atlas`],
    synergy: `Asegura visión y controla zonas con trampas constantes.`,
    playPattern: `Coloca trampas en arbustos, poke con Kupa y derriba torres temprano.`,
    macroFocus: `Pusha línea de oro, protege objetivos con trampas y rota con ventaja temprana.`,
    metrics: { survivability: 3, damageSpike: 3, objectiveControl: 4, teamUtility: 3, scaling: 4 },
  },
  "Uranus": {
    role: `Tank`,
    lane: `EXP`,
    difficulty: `Media`,
    specialties: [`Regeneración`, `Split push`],
    counters: [`sustain`, `split-push`],
    countersHeroes: [`Esmeralda`, `Yu Zhong`, `Lapu-Lapu`, `Zilong`],
    synergyHeroes: [`Diggie`, `Estes`, `Karrie`, `Claude`],
    synergy: `Aguanta daño masivo y mantiene presión constante en side lanes.`,
    playPattern: `Acumula cargas de Energía Radiante, entra y sale para regenerarte y molestar backline.`,
    macroFocus: `Empuja líneas laterales sin morir y arrastra recursos enemigos lejos de objetivos principales.`,
    metrics: { survivability: 5, damageSpike: 2, objectiveControl: 3, teamUtility: 3, scaling: 4 },
  },
};

const heroPool: Hero[] = heroBaseRecords.map((base) => {
  const override = heroGuideOverrides[base.name] ?? {};
  const role = override.role ?? toHeroRole(base.primaryRole);
  const lane = override.lane ?? toLane(base.lane);
  const specialties = override.specialties ?? parseSpecialties(base.specialty);
  const effectiveSpecialties = specialties.length > 0 ? specialties : ["Adaptable"];
  const difficulty = override.difficulty ?? roleDifficultyDefaults[role];
  const counters = override.counters ?? deriveCounters(role, effectiveSpecialties);
  const countersHeroes = override.countersHeroes ?? deriveHeroList(laneCounterPresets[lane], base.name);
  const synergyHeroes = override.synergyHeroes ?? deriveHeroList(laneSynergyPresets[lane], base.name);
  const synergy = override.synergy ?? buildSynergy(role, lane, effectiveSpecialties);
  const playPattern = override.playPattern ?? buildPlayPattern(role, lane, effectiveSpecialties);
  const macroFocus = override.macroFocus ?? buildMacroFocus(role, lane);
  const metrics = override.metrics ?? roleMetricDefaults[role];

  return {
    name: base.name,
    title: base.title,
    role,
    lane,
    difficulty,
    specialties: effectiveSpecialties,
    counters,
    countersHeroes,
    synergyHeroes,
    synergy,
    playPattern,
    macroFocus,
    metrics,
    faction: base.faction,
    release: base.release,
    costs: {
      battlePoints: base.battlePointsCost,
      diamonds: base.diamondCost,
      tickets: base.ticketCost,
      heroFragments: base.heroFragmentsCost,
      luckyGems: base.luckyGemsCost,
    },
  };
});

type CostChipType = "bp" | "diamonds" | "tickets" | "fragments" | "gems";

type CostChip = { type: CostChipType; label: string };

const numberFormatter = new Intl.NumberFormat("es-ES");

const costChipStyles: Record<CostChipType, string> = {
  bp: "border-emerald-400/60 bg-emerald-400/15 text-emerald-100",
  diamonds: "border-cyan-400/60 bg-cyan-400/15 text-cyan-100",
  tickets: "border-amber-400/60 bg-amber-400/15 text-amber-100",
  fragments: "border-purple-400/60 bg-purple-400/15 text-purple-100",
  gems: "border-pink-400/60 bg-pink-400/15 text-pink-100",
};

function getHeroCostChips(costs: HeroCosts): CostChip[] {
  const chips: CostChip[] = [];
  if (costs.battlePoints)
    chips.push({ type: "bp", label: `${numberFormatter.format(costs.battlePoints)} BP` });
  if (costs.diamonds)
    chips.push({ type: "diamonds", label: `${numberFormatter.format(costs.diamonds)} diamantes` });
  if (costs.tickets)
    chips.push({ type: "tickets", label: `${numberFormatter.format(costs.tickets)} tickets` });
  if (costs.heroFragments)
    chips.push({ type: "fragments", label: `${numberFormatter.format(costs.heroFragments)} fragmentos` });
  if (costs.luckyGems)
    chips.push({ type: "gems", label: `${numberFormatter.format(costs.luckyGems)} gemas` });
  return chips;
}

const roles = ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"] as const;

type RoleOption = (typeof roles)[number] | "Cualquiera";

const roleLabels: Record<RoleOption, string> = {
  Tank: "Tanque / Roam",
  Fighter: "Luchador / EXP",
  Assassin: "Asesino / Jungla",
  Mage: "Mago / Mid",
  Marksman: "Tirador / Gold",
  Support: "Soporte / Roam",
  Cualquiera: "Flex",
};

const lanes = ["Gold", "EXP", "Mid", "Jungle", "Roam"] as const;

type LaneOption = Lane | "Todas";

const laneLabels: Record<LaneOption, string> = {
  Todas: "Todas las líneas",
  Gold: "Gold · Tirador",
  EXP: "EXP · Luchador",
  Mid: "Mid · Mago",
  Jungle: "Jungla",
  Roam: "Roam / Soporte",
};

const traitLabels = enemyTraits.reduce<Record<EnemyTrait, string>>((acc, trait) => {
  acc[trait.id] = trait.label;
  return acc;
}, {} as Record<EnemyTrait, string>);

const heroByName = heroPool.reduce<Record<string, Hero>>((acc, hero) => {
  acc[hero.name] = hero;
  return acc;
}, {});

const metricLabels: Record<keyof HeroMetrics, string> = {
  survivability: "Supervivencia",
  damageSpike: "Daño explosivo",
  objectiveControl: "Objetivos",
  teamUtility: "Utilidad de equipo",
  scaling: "Escalado",
};

const sortedHeroPool = [...heroPool].sort((a, b) => a.name.localeCompare(b.name, "es"));

const MAX_TEAM_PICKS = 5;
const MAX_RECOMMENDATIONS = 12;
const FEATURED_RECOMMENDATIONS = 3;

type DraftSide = "enemy" | "ally";

export default function MobileLegendsPicker() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Cualquiera");
  const [selectedLane, setSelectedLane] = useState<LaneOption>("Todas");
  const [activeTraits, setActiveTraits] = useState<EnemyTrait[]>([]);
  const [enemyPicks, setEnemyPicks] = useState<string[]>([]);
  const [allyPicks, setAllyPicks] = useState<string[]>([]);
  const [pickerSide, setPickerSide] = useState<DraftSide | null>(null);
  const [heroSearch, setHeroSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const suggestions = useMemo(() => {
    const allyInfo = allyPicks.reduce(
      (acc, pick) => {
        const hero = heroByName[pick];
        if (!hero) return acc;
        acc.roles[hero.role] = (acc.roles[hero.role] ?? 0) + 1;
        acc.lanes[hero.lane] = (acc.lanes[hero.lane] ?? 0) + 1;
        return acc;
      },
      { roles: {} as Partial<Record<HeroRole, number>>, lanes: {} as Partial<Record<Lane, number>> }
    );

    const candidates = heroPool
      .filter((hero) => (selectedRole === "Cualquiera" ? true : hero.role === selectedRole))
      .filter((hero) => (selectedLane === "Todas" ? true : hero.lane === selectedLane))
      .filter((hero) => !enemyPicks.includes(hero.name) && !allyPicks.includes(hero.name));

    const scored = candidates
      .map((hero) => {
        const traitMatches = activeTraits.filter((trait) => hero.counters.includes(trait));
        const enemyHighlights = enemyPicks.filter((pick) => hero.countersHeroes.includes(pick));
        const allyHighlights = allyPicks.filter((pick) => hero.synergyHeroes.includes(pick));

        const countersScore = traitMatches.length * 12 + enemyHighlights.length * 18;
        const synergyScore = allyHighlights.length * 10;
        const metricsScore =
          hero.metrics.survivability * 2.1 +
          hero.metrics.damageSpike * 2.4 +
          hero.metrics.objectiveControl * 2.2 +
          hero.metrics.teamUtility * 2.5 +
          hero.metrics.scaling * 1.7;
        const laneFocusScore =
          (selectedLane === "Todas" ? 10 : hero.lane === selectedLane ? 22 : 6) +
          (selectedRole === "Cualquiera" ? 8 : hero.role === selectedRole ? 18 : 9);
        const readinessBonus =
          activeTraits.length === 0 && enemyPicks.length === 0 && allyPicks.length === 0 ? 10 : 0;

        const rawTotal = countersScore + synergyScore + metricsScore + laneFocusScore + readinessBonus;

        const roleMultiplier =
          allyInfo.roles[hero.role] && allyInfo.roles[hero.role]! > 0
            ? Math.max(0.5, 1 - (allyInfo.roles[hero.role]! * 0.35))
            : 1;
        const laneMultiplier =
          allyInfo.lanes[hero.lane] && allyInfo.lanes[hero.lane]! > 0
            ? Math.max(0.55, 1 - allyInfo.lanes[hero.lane]! * 0.3)
            : 1;
        const disciplineMultiplier = roleMultiplier * laneMultiplier;

        const finalScore = rawTotal * disciplineMultiplier;

        const breakdown = [
          { label: "Respuesta al enemigo", value: countersScore },
          { label: "Sinergia aliada", value: synergyScore },
          { label: "Plan macro", value: metricsScore },
          { label: "Alineación de rol", value: laneFocusScore },
        ];

        const planSegments = [hero.playPattern];
        if (traitMatches.length > 0) {
          planSegments.push(
            `Tu kit responde a ${
              traitMatches.length > 1 ? "estas amenazas" : "esta amenaza"
            }: ${traitMatches.map((trait) => traitLabels[trait]).join(", ")}.`
          );
        }
        if (enemyHighlights.length > 0) {
          planSegments.push(`Castiga a ${enemyHighlights.join(", ")} cuando busquen iniciarte.`);
        }
        if (allyHighlights.length > 0) {
          planSegments.push(`Sincroniza combos con ${allyHighlights.join(", ")} para acelerar fights.`);
        }
        planSegments.push(hero.macroFocus);

        const allyRoleCount = allyInfo.roles[hero.role] ?? 0;
        const allyLaneCount = allyInfo.lanes[hero.lane] ?? 0;
        const warnings: string[] = [];
        if (disciplineMultiplier < 0.95) {
          warnings.push(
            `Tu equipo ya cuenta con ${allyRoleCount} ${hero.role.toLowerCase()}${
              allyRoleCount === 1 ? "" : "s"
            }.`
          );
        }
        if (allyLaneCount > 0 && (selectedLane === "Todas" || selectedLane === hero.lane)) {
          warnings.push(
            `La línea ${hero.lane} ya tiene ${allyLaneCount} pieza${allyLaneCount === 1 ? "" : "s"} ocupando ese rol.`
          );
        }
        const compositionWarning =
          warnings.length > 0 ? `${warnings.join(" ")} Evalúa flexear o ajustar tu build.` : undefined;

        return {
          hero,
          traitMatches,
          enemyHighlights,
          allyHighlights,
          score: finalScore,
          breakdown,
          plan: planSegments.join(" "),
          compositionWarning,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const limited = scored.slice(0, MAX_RECOMMENDATIONS);
    const maxScore = limited[0]?.score ?? 0;

    return limited.map((entry, index) => {
      const totalBreakdown = entry.breakdown.reduce((acc, item) => acc + item.value, 0);
      const breakdownWithPercent = entry.breakdown.map((item) => ({
        ...item,
        percent: totalBreakdown > 0 ? Math.round((item.value / totalBreakdown) * 100) : 0,
      }));
      return {
        ...entry,
        relativeScore: maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0,
        breakdown: breakdownWithPercent,
        rank: index + 1,
      };
    });
  }, [activeTraits, allyPicks, enemyPicks, selectedLane, selectedRole]);

  const topRecommendations = useMemo(
    () => suggestions.slice(0, FEATURED_RECOMMENDATIONS),
    [suggestions]
  );
  const extendedRecommendations = useMemo(
    () => suggestions.slice(FEATURED_RECOMMENDATIONS),
    [suggestions]
  );

  const toggleTrait = (trait: EnemyTrait) => {
    setActiveTraits((current) =>
      current.includes(trait) ? current.filter((item) => item !== trait) : [...current, trait]
    );
  };

  const handleAddPick = (side: DraftSide, heroName: string) => {
    if (!heroName) return false;
    const update = side === "enemy" ? setEnemyPicks : setAllyPicks;
    let added = false;
    update((current) => {
      if (current.includes(heroName)) return current;
      if (current.length >= MAX_TEAM_PICKS) return current;
      added = true;
      return [...current, heroName];
    });
    return added;
  };

  const handleRemovePick = (side: DraftSide, heroName: string) => {
    const update = side === "enemy" ? setEnemyPicks : setAllyPicks;
    update((current) => current.filter((pick) => pick !== heroName));
  };

  const renderDraftList = (side: DraftSide) => {
    const picks = side === "enemy" ? enemyPicks : allyPicks;
    const label = side === "enemy" ? "Enemigo" : "Aliado";
    const chipColors =
      side === "enemy"
        ? "border-rose-400/40 bg-rose-400/20 text-rose-100"
        : "border-emerald-400/40 bg-emerald-400/20 text-emerald-100";
    const openPicker = () => {
      if (picks.length >= MAX_TEAM_PICKS) return;
      setPickerSide(side);
      setHeroSearch("");
    };
    const isTeamFull = picks.length >= MAX_TEAM_PICKS;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
          <span>{side === "enemy" ? "Picks enemigos" : "Mi equipo"}</span>
          {picks.length > 0 && (
            <button
              type="button"
              onClick={() => (side === "enemy" ? setEnemyPicks([]) : setAllyPicks([]))}
              className="text-[11px] text-fuchsia-300 transition hover:text-fuchsia-200"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          {picks.length === 0 ? (
            <p className="text-[11px] text-zinc-400">Selecciona héroes para el bando {label}.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 text-[11px]">
              {picks.map((pick) => (
                <li
                  key={`${side}-${pick}`}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-white ${chipColors}`}
                >
                  <span>{pick}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePick(side, pick)}
                    className="text-white/70 transition hover:text-white"
                    aria-label={`Quitar ${pick}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={openPicker}
          disabled={isTeamFull}
          className="flex w-full items-center justify-between rounded-2xl border border-dashed border-fuchsia-400/60 bg-fuchsia-400/10 px-4 py-3 text-left text-xs font-semibold text-white transition hover:border-fuchsia-300 hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-400"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-sm text-black shadow-md">
              +
            </span>
            Añadir héroe {label.toLowerCase()}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-fuchsia-200">
            {isTeamFull ? "Equipo completo" : `${picks.length}/${MAX_TEAM_PICKS}`}
          </span>
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!pickerSide) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPickerSide(null);
        setHeroSearch("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickerSide]);

  const recommendedHeroes = useMemo(
    () => new Set(suggestions.map((item) => item.hero.name)),
    [suggestions]
  );

  const heroCards = useMemo(() => {
    if (!pickerSide) return [] as Hero[];
    const search = heroSearch.trim().toLowerCase();
    return sortedHeroPool.filter((hero) => {
      if (enemyPicks.includes(hero.name) || allyPicks.includes(hero.name)) {
        return true;
      }
      if (!search) return true;
      const haystack = [
        hero.name,
        hero.title,
        hero.role,
        hero.lane,
        hero.difficulty,
        hero.specialties.join(" "),
        hero.synergy,
        hero.playPattern,
        hero.macroFocus,
        hero.faction,
        hero.release,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [allyPicks, enemyPicks, heroSearch, pickerSide]);

  const closePicker = () => {
    setPickerSide(null);
    setHeroSearch("");
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200">
      <header className="space-y-2">
        <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
          Mobile Legends Picker
        </span>
        <h3 className="text-xl font-semibold text-white">Encuentra el pick ideal para tu draft</h3>
        <p className="text-xs leading-relaxed text-zinc-300">
          Define tu rol y la línea que quieres jugar, describe la composición enemiga y registra los picks aliados. El
          asistente valora amenazas, sinergias y solidez macro para entregarte opciones ordenadas por puntaje y con un plan
          de ejecución claro.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr] lg:items-start">
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="block text-xs uppercase tracking-wide text-zinc-400">Rol preferido</span>
            <div className="flex flex-wrap gap-2">
              {["Cualquiera", ...roles].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role as RoleOption)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selectedRole === role
                      ? "border-fuchsia-400/80 bg-fuchsia-400/20 text-white"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  {roleLabels[role as RoleOption]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs uppercase tracking-wide text-zinc-400">Línea objetivo</span>
            <div className="flex flex-wrap gap-2">
              {["Todas", ...lanes].map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => setSelectedLane(lane as LaneOption)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    selectedLane === lane
                      ? "border-cyan-400/80 bg-cyan-400/20 text-white"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  {laneLabels[lane as LaneOption]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Amenazas enemigas</span>
              {activeTraits.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTraits([])}
                  className="text-xs text-fuchsia-300 transition hover:text-fuchsia-200"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {enemyTraits.map((trait) => {
                const active = activeTraits.includes(trait.id);
                return (
                  <button
                    key={trait.id}
                    type="button"
                    onClick={() => toggleTrait(trait.id)}
                    className={`h-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-cyan-400/80 bg-cyan-400/20 text-white shadow-md"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-white">{trait.label}</span>
                    <span className="text-xs text-zinc-300">{trait.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {renderDraftList("enemy")}
            {renderDraftList("ally")}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">Recomendaciones</span>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>
                {suggestions.length > 0
                  ? `Top ${suggestions.length} opción${suggestions.length > 1 ? "es" : ""}`
                  : "Ajusta filtros"}
              </span>
              {extendedRecommendations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAdvanced((current) => !current)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  {showAdvanced ? "Ocultar análisis" : "Ver análisis"}
                </button>
              )}
            </div>
          </div>
          {suggestions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
              Añade amenazas, enemigos o aliados para personalizar la búsqueda.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {topRecommendations.map(({ hero, traitMatches, relativeScore, plan, rank, compositionWarning }) => {
                  const quickSentences = plan.match(/[^.]+(?:\.)?/g) ?? [plan];
                  const quickPlan = quickSentences.slice(0, 2).join(" ").trim() || plan;
                  const quickSpecialties = hero.specialties.slice(0, 2);
                  const isInAllyTeam = allyPicks.includes(hero.name);
                  const allyTeamFull = allyPicks.length >= MAX_TEAM_PICKS;
                  const addDisabled = isInAllyTeam || allyTeamFull;
                  return (
                    <div
                      key={`featured-${hero.name}`}
                      className="flex h-full flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-indigo-950/70 to-slate-900/80 p-4 text-left"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-base font-semibold text-white">{hero.name}</span>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                              {hero.role} · {hero.lane} · Dificultad {hero.difficulty}
                            </p>
                          </div>
                          <span className="rounded-full border border-fuchsia-400/60 bg-fuchsia-400/20 px-3 py-1 text-[11px] font-semibold text-fuchsia-100">
                            #{rank}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-200">{hero.synergy}</p>
                        <p className="text-xs text-indigo-200">{quickPlan}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        {quickSpecialties.map((specialty) => (
                          <span
                            key={`${hero.name}-featured-${specialty}`}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5"
                          >
                            {specialty}
                          </span>
                        ))}
                        {traitMatches.length > 0 && (
                          <span className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
                            Responde {traitMatches.length} amenaza{traitMatches.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-fuchsia-400/60 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-100">
                          {relativeScore}/100
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddPick("ally", hero.name)}
                          disabled={addDisabled}
                          className="rounded-full border border-emerald-400/60 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-100 transition hover:border-emerald-300/80 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-400"
                        >
                          {isInAllyTeam ? "Ya en mi draft" : "Agregar al draft"}
                        </button>
                      </div>
                      {compositionWarning && (
                        <p className="text-xs text-amber-300">{compositionWarning}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {showAdvanced && (
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">
                    Análisis detallado de cada opción
                  </p>
                  <ul className="space-y-3">
                    {suggestions.map(
                      ({
                        hero,
                        traitMatches,
                        enemyHighlights,
                        allyHighlights,
                        plan,
                        relativeScore,
                        breakdown,
                        compositionWarning,
                        rank,
                      }) => {
                        const costChips = getHeroCostChips(hero.costs);
                        return (
                          <li key={hero.name} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="grid gap-2 sm:grid-cols-[1fr,auto] sm:items-start">
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{hero.name}</span>
                                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                                    {hero.role}
                                  </span>
                                  <span className="rounded-full border border-fuchsia-400/60 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-fuchsia-100">
                                    #{rank}
                                  </span>
                                </div>
                                <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                                  {hero.lane} lane · Dificultad {hero.difficulty}
                                </span>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wide text-zinc-500">
                                  <span>{hero.title}</span>
                                  <span>• {hero.faction}</span>
                                  <span>• Lanzado: {hero.release}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end justify-center gap-1 text-right">
                                <span className="rounded-full border border-fuchsia-400/60 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold text-fuchsia-100">
                                  {relativeScore}/100
                                </span>
                                <span className="text-[10px] uppercase tracking-wide text-fuchsia-200">Puntaje recomendado</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px] text-zinc-300">
                              {hero.specialties.map((specialty) => (
                                <span key={specialty} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                                  {specialty}
                                </span>
                              ))}
                              {traitMatches.length > 0 && (
                                <span className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
                                  Responde {traitMatches.length} amenaza{traitMatches.length > 1 ? "s" : ""}
                                </span>
                              )}
                              {costChips.map((chip) => (
                                <span
                                  key={`${hero.name}-${chip.type}`}
                                  className={`rounded-full border px-2 py-0.5 ${costChipStyles[chip.type]}`}
                                >
                                  {chip.label}
                                </span>
                              ))}
                            </div>

                            <div className="space-y-2 text-xs leading-relaxed">
                              <p className="text-zinc-300">{hero.synergy}</p>
                              <p className="text-indigo-200">{plan}</p>
                            </div>

                            <div className="space-y-2">
                              <div className="h-2 rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400"
                                  style={{ width: `${Math.min(100, Math.max(relativeScore, 6))}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid gap-2 text-[11px]">
                              {breakdown.map((item) => (
                                <div
                                  key={`${hero.name}-${item.label}`}
                                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                                >
                                  <div className="flex items-center justify-between text-white/90">
                                    <span className="font-semibold">{item.label}</span>
                                    <span className="text-zinc-300">{item.percent}%</span>
                                  </div>
                                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                                    <div
                                      className="h-1.5 rounded-full bg-cyan-400/60"
                                      style={{ width: `${Math.min(100, item.percent)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-2 text-[11px]">
                              {(Object.entries(hero.metrics) as [keyof HeroMetrics, number][]).map(
                                ([metricKey, metricValue]) => {
                                  const percent = Math.round((metricValue / 5) * 100);
                                  return (
                                    <div key={`${hero.name}-${metricKey}`} className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3">
                                      <div className="flex items-center justify-between text-white/90">
                                        <span>{metricLabels[metricKey]}</span>
                                        <span className="text-zinc-300">{metricValue}/5</span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-white/10">
                                        <div
                                          className="h-1.5 rounded-full bg-emerald-400/60"
                                          style={{ width: `${Math.min(100, percent)}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {(enemyHighlights.length > 0 || allyHighlights.length > 0) && (
                              <div className="grid gap-2 text-[11px]">
                                {enemyHighlights.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-rose-100">
                                    <span className="font-semibold uppercase tracking-wide">Castiga</span>
                                    <span>{enemyHighlights.join(", ")}</span>
                                  </div>
                                )}
                                {allyHighlights.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-emerald-100">
                                    <span className="font-semibold uppercase tracking-wide">Sinergiza</span>
                                    <span>{allyHighlights.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {compositionWarning && (
                              <p className="text-xs text-amber-300">{compositionWarning}</p>
                            )}
                          </li>
                        );
                      }
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300">
          <p>
            Consejo: Prioriza la opción con mejor puntaje, pero revisa las alertas de composición. Si saturas un rol o línea,
            considera flexear tu pick o adaptar la build para cubrir carencias del equipo.
          </p>
        </footer>

      {pickerSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur">
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-2xl"
          >
            <div className="flex flex-col gap-4 border-b border-white/5 bg-white/5 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wide text-fuchsia-200">{pickerSide === "enemy" ? "Bando enemigo" : "Mi escuadra"}</span>
                  <h4 className="text-2xl font-semibold">
                    Elige un héroe impresionante
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={closePicker}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-zinc-200 transition hover:border-white/30 hover:bg-white/20"
                >
                  Cerrar
                </button>
              </div>
              <p className="text-xs text-zinc-300">
                Usa la búsqueda para encontrar héroes por nombre, rol o especialidad. Los recomendados por el asistente brillan con un aura especial.
              </p>
              <div className="relative">
                <input
                  autoFocus
                  value={heroSearch}
                  onChange={(event) => setHeroSearch(event.currentTarget.value)}
                  placeholder="Buscar por nombre, rol, sinergias o estilo de juego"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/40"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wide text-zinc-500">
                  {heroCards.length} héroe{heroCards.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {heroCards.map((hero) => {
                  const isTaken = enemyPicks.includes(hero.name) || allyPicks.includes(hero.name);
                  const isRecommended = recommendedHeroes.has(hero.name);
                  const countersActive = activeTraits.some((trait) => hero.counters.includes(trait));
                  const disablesSelection =
                    (pickerSide === "enemy" ? enemyPicks : allyPicks).length >= MAX_TEAM_PICKS || isTaken;
                  const handleSelect = () => {
                    if (!pickerSide || disablesSelection) return;
                    const added = handleAddPick(pickerSide, hero.name);
                    if (added) {
                      closePicker();
                    }
                  };

                  const costChips = getHeroCostChips(hero.costs);

                  const cardBaseClasses =
                    "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition";
                  const cardVariantClasses = isRecommended
                    ? "border-fuchsia-300/80 bg-white text-slate-900 shadow-[0_0_30px_-12px_rgba(217,70,239,0.6)]"
                    : "border-white/10 bg-slate-900/40 text-white hover:border-white/30 hover:bg-white/10";
                  const disabledClasses = disablesSelection
                    ? "opacity-50"
                    : "shadow-[0_0_30px_-15px_rgba(217,70,239,0.9)]";
                  const nameClasses = isRecommended ? "text-lg font-semibold text-slate-900" : "text-lg font-semibold text-white";
                  const metaClasses = isRecommended
                    ? "text-[11px] uppercase tracking-wide text-cyan-600"
                    : "text-[11px] uppercase tracking-wide text-cyan-200";
                  const summaryClasses = isRecommended ? "text-xs text-slate-600" : "text-xs text-zinc-200";
                  const patternClasses = isRecommended ? "text-[11px] text-indigo-600" : "text-[11px] text-indigo-200";
                  const roleChipClasses = isRecommended
                    ? "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-600"
                    : "rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300";
                  const specialtyChipClasses = isRecommended
                    ? "rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-600"
                    : "rounded-full border border-white/20 bg-black/20 px-2 py-0.5";
                  const counterChipClasses = isRecommended
                    ? "rounded-full border border-emerald-500/50 bg-emerald-400/20 px-2 py-0.5 text-emerald-700"
                    : "rounded-full border border-emerald-400/60 bg-emerald-400/20 px-2 py-0.5 text-emerald-100";
                  const recommendedChipClasses = isRecommended
                    ? "rounded-full border border-fuchsia-400/60 bg-fuchsia-200/70 px-2 py-0.5 text-fuchsia-700"
                    : "rounded-full border border-fuchsia-400/70 bg-fuchsia-400/20 px-2 py-0.5 text-fuchsia-100";
                  const takenChipClasses = isRecommended
                    ? "rounded-full border border-amber-400/60 bg-amber-200/70 px-2 py-0.5 text-amber-700"
                    : "rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-amber-100";

                  return (
                    <button
                      key={`${pickerSide}-${hero.name}`}
                      type="button"
                      onClick={handleSelect}
                      disabled={disablesSelection}
                      className={`${cardBaseClasses} ${cardVariantClasses} ${disabledClasses}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className={nameClasses}>{hero.name}</span>
                          <span className={roleChipClasses}>{hero.role}</span>
                        </div>
                        <p className={metaClasses}>
                          {hero.lane} lane · Dificultad {hero.difficulty}
                        </p>
                        <p className={metaClasses}>
                          {hero.title} · {hero.faction} · Lanzado: {hero.release}
                        </p>
                        <p className={summaryClasses}>{hero.synergy}</p>
                        <p className={patternClasses}>{hero.playPattern}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                        {hero.specialties.map((specialty) => (
                          <span key={`${hero.name}-${specialty}`} className={specialtyChipClasses}>
                            {specialty}
                          </span>
                        ))}
                        {costChips.map((chip) => (
                          <span
                            key={`${hero.name}-${chip.type}-modal`}
                            className={`rounded-full border px-2 py-0.5 ${costChipStyles[chip.type]}`}
                          >
                            {chip.label}
                          </span>
                        ))}
                        {countersActive && <span className={counterChipClasses}>Castiga amenazas activas</span>}
                        {isRecommended && <span className={recommendedChipClasses}>Recomendado</span>}
                        {isTaken && <span className={takenChipClasses}>Ocupado</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-xs text-zinc-300">
                <p className="font-semibold text-white">
                  {pickerSide === "enemy"
                    ? "Consejo anti-draft:"
                    : "Inspiración para tu escuadra:"}
                </p>
                <p className="mt-2">
                  {pickerSide === "enemy"
                    ? "Identifica qué picks enemigos te forzaron a reaccionar y construye respuestas con control de mapa y visión."
                    : "Sincroniza tu draft con objetivos neutrales y asegúrate de equilibrar iniciación, daño sostenido y peel."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
