"use client";

import { useMemo, useState } from "react";

type EnemyTrait =
  | "burst"
  | "sustain"
  | "mobility"
  | "crowd-control"
  | "poke"
  | "split-push";

type Hero = {
  name: string;
  role: "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";
  lane: "Gold" | "EXP" | "Mid" | "Jungle" | "Roam";
  difficulty: "Baja" | "Media" | "Alta";
  specialties: string[];
  counters: EnemyTrait[];
  synergy: string;
};

const enemyTraits: { id: EnemyTrait; label: string; description: string }[] = [
  { id: "burst", label: "Daño explosivo", description: "Magos o asesinos con combos rápidos" },
  { id: "sustain", label: "Mucha curación", description: "Composiciones con soporte y regeneración" },
  { id: "mobility", label: "Alta movilidad", description: "Héroes con muchos dashes o escapes" },
  { id: "crowd-control", label: "Mucho CC", description: "Control constante como stuns o slows" },
  { id: "poke", label: "Poke a distancia", description: "Daño constante desde lejos" },
  { id: "split-push", label: "Split push", description: "Presión en líneas laterales" }
];

const heroPool: Hero[] = [
  {
    name: "Khufra",
    role: "Tank",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Iniciación", "Anti-dash"],
    counters: ["mobility", "crowd-control"],
    synergy: "Combina bien con magos de burst como Pharsa o Yve"
  },
  {
    name: "Lolita",
    role: "Tank",
    lane: "Roam",
    difficulty: "Baja",
    specialties: ["Bloqueo de proyectiles", "Shield"],
    counters: ["poke", "crowd-control"],
    synergy: "Protege a tiradores estáticos y devuelve daño con el ultimate"
  },
  {
    name: "Martis",
    role: "Fighter",
    lane: "EXP",
    difficulty: "Media",
    specialties: ["Anti-CC", "Snowball"],
    counters: ["crowd-control", "split-push"],
    synergy: "Encadena con iniciaciones de Atlas o Tigreal"
  },
  {
    name: "Paquito",
    role: "Fighter",
    lane: "EXP",
    difficulty: "Alta",
    specialties: ["Burst", "Movilidad"],
    counters: ["burst", "mobility"],
    synergy: "Castiga picks blandos en EXP y acompaña junglas agresivos"
  },
  {
    name: "Lancelot",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Desplazamientos", "Invulnerabilidad"],
    counters: ["sustain", "poke"],
    synergy: "Requiere front line sólida y control previo"
  },
  {
    name: "Fanny",
    role: "Assassin",
    lane: "Jungle",
    difficulty: "Alta",
    specialties: ["Movilidad extrema", "Pick-off"],
    counters: ["split-push", "poke"],
    synergy: "Funciona con roamers de control que aseguren ángulos"
  },
  {
    name: "Lylia",
    role: "Mage",
    lane: "Mid",
    difficulty: "Media",
    specialties: ["Burst", "Escape"],
    counters: ["crowd-control", "poke"],
    synergy: "Empuja líneas rápido y rota con roamers agresivos"
  },
  {
    name: "Yve",
    role: "Mage",
    lane: "Mid",
    difficulty: "Alta",
    specialties: ["Zona", "Control"],
    counters: ["mobility", "split-push"],
    synergy: "Define teamfights prolongadas con frontales que mantengan enemigos en su ultimate"
  },
  {
    name: "Brody",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Media",
    specialties: ["Burst", "Escalado"],
    counters: ["mobility", "crowd-control"],
    synergy: "Castiga entradas agresivas y aprovecha peel de roamers"
  },
  {
    name: "Beatrix",
    role: "Marksman",
    lane: "Gold",
    difficulty: "Alta",
    specialties: ["Flexibilidad", "Rango"],
    counters: ["poke", "split-push"],
    synergy: "Se potencia con supports que le den visión y control del mapa"
  },
  {
    name: "Estes",
    role: "Support",
    lane: "Roam",
    difficulty: "Baja",
    specialties: ["Curación", "Sostenimiento"],
    counters: ["poke", "split-push"],
    synergy: "Brilla en composiciones de teamfight 5v5 y front to back"
  },
  {
    name: "Diggie",
    role: "Support",
    lane: "Roam",
    difficulty: "Media",
    specialties: ["Anti-CC", "Utilidad"],
    counters: ["crowd-control", "burst"],
    synergy: "Asegura contra picks con lockdown fuerte y protege carries"
  }
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
  Cualquiera: "Flex"
};

export default function MobileLegendsPicker() {
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Cualquiera");
  const [activeTraits, setActiveTraits] = useState<EnemyTrait[]>([]);

  const suggestions = useMemo(() => {
    const candidates = heroPool.filter((hero) =>
      selectedRole === "Cualquiera" ? true : hero.role === selectedRole
    );

    const scored = candidates
      .map((hero) => {
        const matches = activeTraits.filter((trait) => hero.counters.includes(trait)).length;
        return {
          hero,
          matches,
          score: matches * 2 + (activeTraits.length === 0 ? 1 : 0)
        };
      })
      .filter((entry) => (activeTraits.length > 0 ? entry.matches > 0 : true))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 4);
  }, [activeTraits, selectedRole]);

  const toggleTrait = (trait: EnemyTrait) => {
    setActiveTraits((current) =>
      current.includes(trait) ? current.filter((item) => item !== trait) : [...current, trait]
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
          Selecciona el rol que deseas jugar y marca las características principales del equipo enemigo.
          Te sugeriremos héroes populares en el meta actual que funcionan como respuesta.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr] md:items-start">
        <div className="space-y-4">
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
              Añade amenazas enemigas o cambia de rol para ver picks sugeridos.
            </p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map(({ hero, matches }) => (
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
                    {matches > 0 && (
                      <span className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 text-cyan-200">
                        Contrarresta {matches} amenaza{matches > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-300">{hero.synergy}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <footer className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-300">
        <p>
          Consejo: Combina estas recomendaciones con la composición de tu equipo.
          Si tienes doble tanque, considera habilitar un hyper carry y picks de daño sostenido.
        </p>
      </footer>
    </div>
  );
}
