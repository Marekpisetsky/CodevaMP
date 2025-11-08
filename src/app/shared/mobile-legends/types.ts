export type EnemyTrait =
  | "burst"
  | "sustain"
  | "mobility"
  | "crowd-control"
  | "poke"
  | "split-push";

export type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";

export type Lane = "Gold" | "EXP" | "Mid" | "Jungle" | "Roam";

export type HeroMetrics = {
  survivability: number;
  damageSpike: number;
  objectiveControl: number;
  teamUtility: number;
  scaling: number;
};

export type HeroCosts = {
  battlePoints?: number;
  diamonds?: number;
  tickets?: number;
  heroFragments?: number;
  luckyGems?: number;
};

export type HeroRecord = {
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

export type MlbbDraftAgentItem = {
  name: string;
  description: string;
  recommendedFor: string[];
  timing: string;
};

export type MlbbDraftAgentBan = {
  hero: string;
  priority: "Alta" | "Media" | "Situacional";
  reason: string;
};

export type MlbbDraftAgentPick = {
  role: string;
  headline: string;
  heroes: string[];
  plan: string;
};

export type MlbbDraftAgentBuild = {
  hero: string;
  coreItems: string[];
  situationalItems: string[];
  notes: string;
};

export type MlbbDraftAgent = {
  version: string;
  updatedAt: string;
  latestItem: MlbbDraftAgentItem;
  bans: MlbbDraftAgentBan[];
  priorityPicks: MlbbDraftAgentPick[];
  builds: MlbbDraftAgentBuild[];
  notes: string[];
};