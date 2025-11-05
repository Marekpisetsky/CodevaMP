"use client";

import { useEffect, useMemo, useState } from "react";

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

type Hero = {
  name: string;
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
};

const enemyTraits: { id: EnemyTrait; label: string; description: string }[] = [
  { id: "burst", label: "Daño explosivo", description: "Magos o asesinos con combos rápidos" },
  { id: "sustain", label: "Mucha curación", description: "Composiciones con soporte y regeneración" },
  { id: "mobility", label: "Alta movilidad", description: "Héroes con muchos dashes o escapes" },
  { id: "crowd-control", label: "Mucho CC", description: "Control constante como stuns o slows" },
  { id: "poke", label: "Poke a distancia", description: "Daño constante desde lejos" },
  { id: "split-push", label: "Split push", description: "Presión en líneas laterales" },
];

const heroPool: Hero[] = [
  {
    name: "Khufra",
    role: "Tank",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Iniciación", "Anti-dash"],
    counters: ["mobility", "crowd-control"],
    countersHeroes: ["Fanny", "Lancelot", "Ling", "Claude"],
    synergyHeroes: ["Pharsa", "Yve", "Lylia", "Brody"],
    synergy: "Caza asesinos móviles y permite que tus magos canalicen daño a salvo.",
    playPattern: "Marca al jungla enemigo, corta dashes con Bouncing Ball y fuerza Tyrant's Rage sobre objetivos clave.",
    macroFocus: "Asegura visión alrededor de tortuga y lord, zonificando entradas con tu cuerpo y control.",
    metrics: {
      survivability: 5,
      damageSpike: 3,
      objectiveControl: 4,
      teamUtility: 5,
      scaling: 3,
    },
  },
  {
    name: "Lolita",
    role: "Tank",
    lane: "Roam",
    difficulty: "Baja",
    specialties: ["Bloqueo de proyectiles", "Shield"],
    counters: ["poke", "crowd-control"],
    countersHeroes: ["Beatrix", "Brody", "Claude", "Pharsa"],
    synergyHeroes: ["Brody", "Beatrix", "Claude", "Wanwan"],
    synergy: "Protege tiradores estáticos y devuelve daño masivo con el Noumenon Blast.",
    playPattern: "Mantén cargado el escudo para negar poke y castiga engages con flicker + ultimate sorpresivo.",
    macroFocus: "Juega alrededor de tu tirador: rota temprano a Gold y acompaña inicios de objetivos mayores.",
    metrics: {
      survivability: 4,
      damageSpike: 3,
      objectiveControl: 4,
      teamUtility: 5,
      scaling: 4,
    },
  },
  {
    name: "Martis",
    role: "Fighter",
    lane: "EXP",
    difficulty: "Media",
    specialties: ["Anti-CC", "Snowball"],
    counters: ["crowd-control", "split-push"],
    countersHeroes: ["Fredrinn", "Tigreal", "Atlas", "Esmeralda"],
    synergyHeroes: ["Lancelot", "Pharsa", "Yve", "Claude"],
    synergy: "Se mantiene en pelea prolongada y remata objetivos con su ultimate.",
    playPattern: "Spamea Mortal Coil para reposicionarte, cancela controles y remata con Decimation en ejecuciones seguras.",
    macroFocus: "Empuja side lane tras ganar presión y rota al mid con ventaja de vida para forzar objetivos.",
    metrics: {
      survivability: 4,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 3,
      scaling: 4,
    },
  },
  {
    name: "Paquito",
    role: "Fighter",
    lane: "EXP",
    difficulty: "Alta",
    specialties: ["Burst", "Movilidad"],
    counters: ["burst", "mobility"],
    countersHeroes: ["Martis", "Esmeralda", "Benedetta", "Fredrinn"],
    synergyHeroes: ["Lancelot", "Angela", "Diggie"],
    synergy: "Castiga frontales blandos y mantiene presión constante en side lanes.",
    playPattern: "Acumula stacks con combos cortos y entra con Knockout Strike cuando puedas forzar 100% del burst.",
    macroFocus: "Desplaza la pelea a tu línea tras limpiar oleadas y busca flanquear por la retaguardia en teamfights.",
    metrics: {
      survivability: 3,
      damageSpike: 5,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 4,
    },
  },
  {
    name: "Lancelot",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Desplazamientos", "Invulnerabilidad"],
    counters: ["sustain", "poke"],
    countersHeroes: ["Estes", "Esmeralda", "Brody", "Wanwan"],
    synergyHeroes: ["Diggie", "Angela", "Khufra", "Atlas"],
    synergy: "Aprovecha gaps creados por tu roamer para eliminar backline de un combo.",
    playPattern: "Resetea Thorned Rose tras cada dash, invade cuando tengas púas disponibles y guarda Phantom Execution defensivo.",
    macroFocus: "Mantén presión en campamentos enemigos y forzad pick-offs antes de cada objetivo neutral.",
    metrics: {
      survivability: 3,
      damageSpike: 5,
      objectiveControl: 4,
      teamUtility: 3,
      scaling: 3,
    },
  },
  {
    name: "Fanny",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Movilidad extrema", "Pick-off"],
    counters: ["split-push", "poke"],
    countersHeroes: ["Beatrix", "Claude", "Ling", "Wanwan"],
    synergyHeroes: ["Lolita", "Diggie", "Angela"],
    synergy: "Domina cielos abiertos cuando tu equipo controla visión y energías.",
    playPattern: "Traza rutas dobles para entrar y salir, administra energía con kills rápidas y evita zonas con CC pesado.",
    macroFocus: "Divide el mapa presionando líneas abiertas y cierra peleas antes de quedarte sin recursos.",
    metrics: {
      survivability: 2,
      damageSpike: 5,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 3,
    },
  },
  {
    name: "Ling",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Split push", "Reinicios"],
    counters: ["split-push", "poke"],
    countersHeroes: ["Beatrix", "Yve", "Lylia", "Claude"],
    synergyHeroes: ["Diggie", "Khufra", "Angela"],
    synergy: "Divide el mapa y fuerza errores con llegadas inesperadas desde los muros.",
    playPattern: "Permanece en muros para cargar energía, cae sobre backline y usa Tempest of Blades para reposicionarte.",
    macroFocus: "Mantén oleadas laterales avanzadas y busca steals o picks cuando el enemigo rota mal.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 4,
      teamUtility: 2,
      scaling: 4,
    },
  },
  {
    name: "Lylia",
    role: "Mage",
    lane: "Mid",
    difficulty: "Media",
    specialties: ["Burst", "Escape"],
    counters: ["crowd-control", "poke"],
    countersHeroes: ["Valentina", "Esmeralda", "Martis", "Claude"],
    synergyHeroes: ["Khufra", "Atlas", "Tigreal", "Brody"],
    synergy: "Empuja líneas rápido y habilita rotaciones agresivas.",
    playPattern: "Coloca sombras para zonas seguras, limpia wave con Bombs y reserva Black Shoes como botón de reset.",
    macroFocus: "Presiona mid constantemente y acompaña al jungla en invasiones con movilidad disponible.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 3,
      scaling: 3,
    },
  },
  {
    name: "Yve",
    role: "Mage",
    lane: "Mid",
    difficulty: "Alta",
    specialties: ["Zona", "Control"],
    counters: ["mobility", "split-push"],
    countersHeroes: ["Ling", "Fanny", "Gusion", "Benedetta"],
    synergyHeroes: ["Khufra", "Atlas", "Tigreal", "Martis"],
    synergy: "Controla teamfights largas con su Starfield y pokea a distancia.",
    playPattern: "Configura Starfield en choke points y alterna líneas y explosiones para mantener a raya engages.",
    macroFocus: "Acompaña a tu roamer para colocar visión y controla objetivos forzando peleas en zonas cerradas.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 4,
      teamUtility: 4,
      scaling: 4,
    },
  },
  {
    name: "Pharsa",
    role: "Mage",
    lane: "Mid",
    difficulty: "Media",
    specialties: ["Rango", "Daño en área"],
    counters: ["split-push", "poke"],
    countersHeroes: ["Claude", "Wanwan", "Brody", "Valentina"],
    synergyHeroes: ["Khufra", "Atlas", "Diggie"],
    synergy: "Castiga posiciones malas con ultimate global y disuade engages.",
    playPattern: "Abusa de la forma de ave para rotar, inicia Fethered Air Strike desde fog y remata con burst distante.",
    macroFocus: "Juega alrededor de mid y oro, usando la ultimate para defender o castigar objetivos neutrales.",
    metrics: {
      survivability: 2,
      damageSpike: 4,
      objectiveControl: 4,
      teamUtility: 3,
      scaling: 3,
    },
  },
  {
    name: "Brody",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Media",
    specialties: ["Burst", "Escalado"],
    counters: ["mobility", "crowd-control"],
    countersHeroes: ["Wanwan", "Claude", "Esmeralda", "Gusion"],
    synergyHeroes: ["Lolita", "Diggie", "Khufra"],
    synergy: "Pega fuerte en mid game y castiga engages prematuros.",
    playPattern: "Abusa de combos básicos + skill 1, controla distancias con stun y busca ultimate cuando tengas 4 marcas.",
    macroFocus: "Prioriza la primera torre de Oro, rota al mid tras minuto 8 para derrumbar estructuras con tu burst.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 4,
    },
  },
  {
    name: "Beatrix",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Alta",
    specialties: ["Flexibilidad", "Rango"],
    counters: ["poke", "split-push"],
    countersHeroes: ["Brody", "Claude", "Wanwan", "Esmeralda"],
    synergyHeroes: ["Lolita", "Diggie", "Estes", "Claude"],
    synergy: "Adapta armas según la composición y aporta burst desde lejos.",
    playPattern: "Alterna armas para limpiar wave segura y ejecuta combos Nibiru + Renner para objetivos clave.",
    macroFocus: "Mantén control de la línea de oro y rota con Renner para amenazar snipes en teamfights.",
    metrics: {
      survivability: 2,
      damageSpike: 5,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 4,
    },
  },
  {
    name: "Claude",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Alta",
    specialties: ["Escalado", "Movilidad"],
    counters: ["sustain", "split-push"],
    countersHeroes: ["Estes", "Esmeralda", "Brody", "Diggie"],
    synergyHeroes: ["Angela", "Diggie", "Khufra"],
    synergy: "Se potencia con peel y control, explotando con su Blazing Duet.",
    playPattern: "Gestiona stacks con Art of Thievery, limpia rápido y entra con Blazing Duet tras un buen control aliado.",
    macroFocus: "Farmea hasta items clave y busca colapsos coordinados sobre la backline con movilidad de Battle Mirror.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 3,
      scaling: 5,
    },
  },
  {
    name: "Wanwan",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Alta",
    specialties: ["Movilidad", "True damage"],
    counters: ["sustain", "split-push"],
    countersHeroes: ["Esmeralda", "Fredrinn", "Tigreal", "Atlas"],
    synergyHeroes: ["Diggie", "Lolita", "Estes"],
    synergy: "Rompe frontales cuando tu equipo puede revelar y marcar objetivos.",
    playPattern: "Marca a enemigos con ataques básicos, activa ultimate tras romper debilidades y usa crossbow para limpiar.",
    macroFocus: "Mantén visión de flancos, espera controles aliados y utiliza tu movilidad para rematar objetivos extendidos.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 5,
    },
  },
  {
    name: "Estes",
    role: "Support",
    lane: "Roam",
    difficulty: "Baja",
    specialties: ["Curación", "Sostenimiento"],
    counters: ["poke", "split-push"],
    countersHeroes: ["Lancelot", "Ling", "Gusion", "Fanny"],
    synergyHeroes: ["Brody", "Beatrix", "Wanwan", "Claude"],
    synergy: "Brilla en composiciones de teamfight 5v5 y front to back.",
    playPattern: "Mantén lazos activos sobre tu tirador, usa ultimate para contrarrestar engages y coloca slow fields.",
    macroFocus: "Reúne al equipo en objetivos mayores y evita que se separen demasiado de tu aura de curación.",
    metrics: {
      survivability: 4,
      damageSpike: 2,
      objectiveControl: 3,
      teamUtility: 5,
      scaling: 4,
    },
  },
  {
    name: "Diggie",
    role: "Support",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Anti-CC", "Utilidad"],
    counters: ["crowd-control", "burst"],
    countersHeroes: ["Khufra", "Atlas", "Tigreal", "Gusion"],
    synergyHeroes: ["Lancelot", "Claude", "Fanny", "Wanwan"],
    synergy: "Neutraliza lockdown y otorga libertad a asesinos y tiradores.",
    playPattern: "Molesta con bombas, guarda Time Journey para negar ultimates clave y protege rutas de escape.",
    macroFocus: "Acompaña rotaciones agresivas y mantén control de visión con bombas en arbustos críticos.",
    metrics: {
      survivability: 3,
      damageSpike: 2,
      objectiveControl: 3,
      teamUtility: 5,
      scaling: 4,
    },
  },
  {
    name: "Atlas",
    role: "Tank",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Wombo combo", "Control"],
    counters: ["crowd-control", "mobility"],
    countersHeroes: ["Brody", "Claude", "Wanwan", "Paquito"],
    synergyHeroes: ["Yve", "Pharsa", "Lylia", "Claude"],
    synergy: "Engage letal cuando tu equipo sigue con daño en área.",
    playPattern: "Abusa de Perfect Match para entrar, recoge con Fatal Links y combina con flicker para arrastrar múltiples objetivos.",
    macroFocus: "Coordina engages en espacios cerrados y fuerza purificaciones antes de objetivos críticos.",
    metrics: {
      survivability: 4,
      damageSpike: 3,
      objectiveControl: 4,
      teamUtility: 5,
      scaling: 3,
    },
  },
  {
    name: "Tigreal",
    role: "Tank",
    lane: "Roam",
    difficulty: "Baja",
    specialties: ["Control", "Iniciación"],
    counters: ["mobility", "burst"],
    countersHeroes: ["Gusion", "Fanny", "Lancelot", "Ling"],
    synergyHeroes: ["Yve", "Pharsa", "Brody", "Wanwan"],
    synergy: "Encadena combos sencillos con flicker que cambian peleas.",
    playPattern: "Engagea con Sacred Hammer + Implosion tras limpiar visión y guarda flicker para sorprender.",
    macroFocus: "Forma front to back, protege a tus carries y controla entradas a objetivos con tu cuerpo.",
    metrics: {
      survivability: 4,
      damageSpike: 2,
      objectiveControl: 3,
      teamUtility: 4,
      scaling: 3,
    },
  },
  {
    name: "Angela",
    role: "Support",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Aceleración", "Escudos"],
    counters: ["burst", "mobility"],
    countersHeroes: ["Lancelot", "Gusion", "Paquito", "Benedetta"],
    synergyHeroes: ["Lancelot", "Ling", "Claude", "Wanwan"],
    synergy: "Potencia asesinos hyper con sus buffs y ultimate global.",
    playPattern: "Mantente cerca de tu carry principal, carga corazones y usa ultimate reactiva para potenciar engages.",
    macroFocus: "Sincroniza tus rotaciones con el jungla y asegura que siempre tengas objetivo para montar.",
    metrics: {
      survivability: 3,
      damageSpike: 2,
      objectiveControl: 3,
      teamUtility: 5,
      scaling: 4,
    },
  },
  {
    name: "Esmeralda",
    role: "Fighter",
    lane: "EXP",
    difficulty: "Media",
    specialties: ["Robo de escudos", "Sostenimiento"],
    counters: ["sustain", "burst"],
    countersHeroes: ["Estes", "Angela", "Pharsa", "Yve"],
    synergyHeroes: ["Diggie", "Claude", "Brody"],
    synergy: "Robusta en peleas largas con escudos casi infinitos.",
    playPattern: "Alterna absorción de escudos con movilidad constante y entra cuando puedas robar barreras enemigas.",
    macroFocus: "Mantén presión lateral y corta oleadas para forzar respuestas mientras preparas flancos.",
    metrics: {
      survivability: 5,
      damageSpike: 3,
      objectiveControl: 3,
      teamUtility: 3,
      scaling: 4,
    },
  },
  {
    name: "Benedetta",
    role: "Assassin",
    lane: "EXP",
    difficulty: "Alta",
    specialties: ["Escape", "Sidelane"],
    counters: ["split-push", "mobility"],
    countersHeroes: ["Paquito", "Martis", "Esmeralda", "Brody"],
    synergyHeroes: ["Lancelot", "Ling", "Angela"],
    synergy: "Presiona líneas y aporta control inesperado en peleas.",
    playPattern: "Carga espadas moviéndote, limpia wave con combos rápidos y busca stuns sorpresivos con Alecto.",
    macroFocus: "Juega a los flancos, divide mapa y conecta con tu equipo cuando hayas empujado profundo.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 4,
    },
  },
  {
    name: "Gusion",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Burst", "Explosión"],
    counters: ["sustain", "poke"],
    countersHeroes: ["Estes", "Pharsa", "Yve", "Lylia"],
    synergyHeroes: ["Diggie", "Angela", "Khufra"],
    synergy: "Explota carries blandos con combos rápidos de dagas.",
    playPattern: "Encadena dagas y ultimate para burst instantáneo, resetea con Sword Spike para reposicionarte.",
    macroFocus: "Aprovecha ventanas de ultimate disponible para buscar picks antes de objetivos y resets rápidos.",
    metrics: {
      survivability: 2,
      damageSpike: 5,
      objectiveControl: 3,
      teamUtility: 2,
      scaling: 3,
    },
  },
  {
    name: "Valentina",
    role: "Mage",
    lane: "Mid",
    difficulty: "Alta",
    specialties: ["Flex", "Utility"],
    counters: ["crowd-control", "burst"],
    countersHeroes: ["Lylia", "Pharsa", "Yve", "Tigreal"],
    synergyHeroes: ["Esmeralda", "Martis", "Atlas"],
    synergy: "Se adapta al draft enemigo copiando ultimates clave.",
    playPattern: "Roba ultimate valiosa, juega agresivo con cargas de Shadow Strike y asegura experiencia extra.",
    macroFocus: "Controla mid, roba campamentos con movilidad y replica engages enemigos a tu favor.",
    metrics: {
      survivability: 3,
      damageSpike: 4,
      objectiveControl: 3,
      teamUtility: 4,
      scaling: 4,
    },
  },
  {
    name: "Fredrinn",
    role: "Tank",
    lane: "EXP",
    difficulty: "Media",
    specialties: ["Sostenimiento", "Counter engage"],
    counters: ["burst", "crowd-control"],
    countersHeroes: ["Lancelot", "Gusion", "Fanny", "Ling"],
    synergyHeroes: ["Yve", "Pharsa", "Brody"],
    synergy: "Genera espacio absorbiendo daño y devolviendo control.",
    playPattern: "Acumula combos con energía, usa taunts para frenar engages y remata con energía máxima.",
    macroFocus: "Toma presión en línea, rota lentamente con tu jungla y absorbe recursos enemigos en peleas largas.",
    metrics: {
      survivability: 5,
      damageSpike: 3,
      objectiveControl: 4,
      teamUtility: 4,
      scaling: 4,
    },
  },
];

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

type DraftSide = "enemy" | "ally";

export default function MobileLegendsPicker() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Cualquiera");
  const [selectedLane, setSelectedLane] = useState<LaneOption>("Todas");
  const [activeTraits, setActiveTraits] = useState<EnemyTrait[]>([]);
  const [enemyPicks, setEnemyPicks] = useState<string[]>([]);
  const [allyPicks, setAllyPicks] = useState<string[]>([]);
  const [pickerSide, setPickerSide] = useState<DraftSide | null>(null);
  const [heroSearch, setHeroSearch] = useState("");

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

    const maxScore = scored[0]?.score ?? 0;

    return scored.slice(0, 5).map((entry) => {
      const totalBreakdown = entry.breakdown.reduce((acc, item) => acc + item.value, 0);
      const breakdownWithPercent = entry.breakdown.map((item) => ({
        ...item,
        percent: totalBreakdown > 0 ? Math.round((item.value / totalBreakdown) * 100) : 0,
      }));
      return {
        ...entry,
        relativeScore: maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0,
        breakdown: breakdownWithPercent,
      };
    });
  }, [activeTraits, allyPicks, enemyPicks, selectedLane, selectedRole]);

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
        hero.role,
        hero.lane,
        hero.difficulty,
        hero.specialties.join(" "),
        hero.synergy,
        hero.playPattern,
        hero.macroFocus,
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Recomendaciones</span>
            <span className="text-xs text-zinc-400">
              {suggestions.length > 0
                ? `${suggestions.length} opción${suggestions.length > 1 ? "es" : ""}`
                : "Ajusta filtros"}
            </span>
          </div>
          {suggestions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
              Añade amenazas, enemigos o aliados para personalizar la búsqueda.
            </p>
          ) : (
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
                }) => (
                  <li key={hero.name} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{hero.name}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                          {hero.role}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                        {hero.lane} lane · Dificultad {hero.difficulty}
                      </span>
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
                    </div>

                    <div className="space-y-2 text-xs leading-relaxed">
                      <p className="text-zinc-300">{hero.synergy}</p>
                      <p className="text-indigo-200">{plan}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-fuchsia-200">
                        <span>Puntaje recomendado</span>
                        <span className="font-semibold">{relativeScore}/100</span>
                      </div>
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
                            <span className="font-semibold uppercase tracking-wide">Sinergia</span>
                            <span>{allyHighlights.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {compositionWarning && (
                      <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100">
                        {compositionWarning}
                      </p>
                    )}
                  </li>
                )
              )}
            </ul>
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

                  return (
                    <button
                      key={`${pickerSide}-${hero.name}`}
                      type="button"
                      onClick={handleSelect}
                      disabled={disablesSelection}
                      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-4 text-left transition ${
                        isRecommended
                          ? "border-fuchsia-400/70 bg-gradient-to-br from-fuchsia-500/30 via-purple-500/20 to-cyan-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                      } ${disablesSelection ? "opacity-50" : "shadow-[0_0_30px_-15px_rgba(217,70,239,0.9)]"}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">{hero.name}</span>
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-wide text-zinc-300">
                            {hero.role}
                          </span>
                        </div>
                        <p className="text-[11px] uppercase tracking-wide text-cyan-200">
                          {hero.lane} lane · Dificultad {hero.difficulty}
                        </p>
                        <p className="text-xs text-zinc-200">{hero.synergy}</p>
                        <p className="text-[11px] text-indigo-200">{hero.playPattern}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-zinc-200">
                        {hero.specialties.map((specialty) => (
                          <span
                            key={`${hero.name}-${specialty}`}
                            className="rounded-full border border-white/20 bg-black/20 px-2 py-0.5"
                          >
                            {specialty}
                          </span>
                        ))}
                        {countersActive && (
                          <span className="rounded-full border border-emerald-400/60 bg-emerald-400/20 px-2 py-0.5 text-emerald-100">
                            Castiga amenazas activas
                          </span>
                        )}
                        {isRecommended && (
                          <span className="rounded-full border border-fuchsia-400/70 bg-fuchsia-400/20 px-2 py-0.5 text-fuchsia-100">
                            Recomendado
                          </span>
                        )}
                        {isTaken && (
                          <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-amber-100">
                            Ocupado
                          </span>
                        )}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 translate-y-12 bg-gradient-to-t from-black/70 via-black/0 to-transparent transition group-hover:translate-y-6" />
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
