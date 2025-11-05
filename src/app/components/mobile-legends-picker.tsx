"use client";

import { useMemo, useState } from "react";

type EnemyTrait =
  | "burst"
  | "sustain"
  | "mobility"
  | "crowd-control"
  | "poke"
  | "split-push";

type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";

type Lane = "Gold" | "EXP" | "Mid" | "Jungle" | "Roam";

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

const heroOptions = [...heroPool]
  .map((hero) => hero.name)
  .sort((a, b) => a.localeCompare(b, "es"));

const MAX_TEAM_PICKS = 5;

type DraftSide = "enemy" | "ally";

export default function MobileLegendsPicker() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Cualquiera");
  const [activeTraits, setActiveTraits] = useState<EnemyTrait[]>([]);
  const [enemyPicks, setEnemyPicks] = useState<string[]>([]);
  const [allyPicks, setAllyPicks] = useState<string[]>([]);

  const suggestions = useMemo(() => {
    const candidates = heroPool
      .filter((hero) => (selectedRole === "Cualquiera" ? true : hero.role === selectedRole))
      .filter((hero) => !enemyPicks.includes(hero.name) && !allyPicks.includes(hero.name));

    const scored = candidates
      .map((hero) => {
        const traitMatches = activeTraits.filter((trait) => hero.counters.includes(trait));
        const enemyHighlights = enemyPicks.filter((pick) => hero.countersHeroes.includes(pick));
        const allyHighlights = allyPicks.filter((pick) => hero.synergyHeroes.includes(pick));

        const baseScore = activeTraits.length === 0 && enemyPicks.length === 0 ? 1 : 0;
        const roleBonus = selectedRole === "Cualquiera" ? 0.5 : 1;

        const score =
          traitMatches.length * 2.2 +
          enemyHighlights.length * 3.4 +
          allyHighlights.length * 1.5 +
          roleBonus +
          baseScore;

        return {
          hero,
          traitMatches,
          enemyHighlights,
          allyHighlights,
          score,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5);
  }, [activeTraits, allyPicks, enemyPicks, selectedRole]);

  const toggleTrait = (trait: EnemyTrait) => {
    setActiveTraits((current) =>
      current.includes(trait) ? current.filter((item) => item !== trait) : [...current, trait]
    );
  };

  const handleAddPick = (side: DraftSide, heroName: string) => {
    if (!heroName) return;
    const update = side === "enemy" ? setEnemyPicks : setAllyPicks;
    update((current) => {
      if (current.includes(heroName)) return current;
      if (current.length >= MAX_TEAM_PICKS) return current;
      return [...current, heroName];
    });
  };

  const handleRemovePick = (side: DraftSide, heroName: string) => {
    const update = side === "enemy" ? setEnemyPicks : setAllyPicks;
    update((current) => current.filter((pick) => pick !== heroName));
  };

  const renderDraftList = (side: DraftSide) => {
    const picks = side === "enemy" ? enemyPicks : allyPicks;
    const label = side === "enemy" ? "Enemigo" : "Aliado";

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
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1"
                >
                  <span>{pick}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePick(side, pick)}
                    className="text-zinc-400 transition hover:text-white"
                    aria-label={`Quitar ${pick}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <select
          disabled={(side === "enemy" ? enemyPicks : allyPicks).length >= MAX_TEAM_PICKS}
          defaultValue=""
          onChange={(event) => {
            handleAddPick(side, event.currentTarget.value);
            event.currentTarget.value = "";
          }}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition focus:border-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="" disabled>
            Añadir héroe {label.toLowerCase()}
          </option>
          {heroOptions.map((option) => {
            const picks = side === "enemy" ? enemyPicks : allyPicks;
            const opposite = side === "enemy" ? allyPicks : enemyPicks;
            const disabled = picks.includes(option) || opposite.includes(option);
            return (
              <option key={`${side}-${option}`} value={option} disabled={disabled}>
                {option}
                {disabled ? " (ocupado)" : ""}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  return (
    <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200">
      <header className="space-y-2">
        <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
          Mobile Legends Picker
        </span>
        <h3 className="text-xl font-semibold text-white">Encuentra el pick ideal para tu draft</h3>
        <p className="text-xs leading-relaxed text-zinc-300">
          Selecciona tu rol, describe la composición enemiga y registra los picks aliados. El asistente pondera amenazas,
          sinergias y tu estilo para recomendar héroes coherentes con el meta actual.
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
              {suggestions.map(({ hero, traitMatches, enemyHighlights, allyHighlights }) => (
                <li key={hero.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-white">{hero.name}</span>
                      <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                        {hero.role}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                      {hero.lane} lane · Dificultad {hero.difficulty}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300">
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
                  <p className="mt-3 text-xs leading-relaxed text-zinc-300">{hero.synergy}</p>
                  {(enemyHighlights.length > 0 || allyHighlights.length > 0) && (
                    <div className="mt-3 grid gap-2 text-[11px]">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300">
        <p>
          Consejo: Ajusta el draft si compartes rol con un aliado. Puedes bloquear picks enemigos clave o pivotear a composiciones
          de comfort cuando el meta no favorece tu pool.
        </p>
      </footer>
    </div>
  );
}
