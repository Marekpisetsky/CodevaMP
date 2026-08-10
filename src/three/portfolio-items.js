// Single source of truth for the Modalidades carousel — add/edit a mode
// here, nothing else needs to change. `glbUrl: null` means "use the
// procedural placeholder shape"; set it once the real Blender export for
// that mode exists and modalidad-scene.js picks it up automatically.
export const PORTFOLIO_ITEMS = [
  {
    id: 'bedwars',
    tag: 'MODALIDAD_01',
    title: 'Bedwars',
    stat: 'DEFENSA.PVP',
    description: 'Defender la cama, romper la ajena, sobrevivir a la isla vecina.',
    color: 0xe8342a,
    glbUrl: null,
  },
  {
    id: 'skywars',
    tag: 'MODALIDAD_02',
    title: 'Skywars',
    stat: 'LOOT.LIMITADO',
    description: 'Islas flotantes, loot limitado y decisiones sin segunda oportunidad.',
    color: 0x46bed7,
    glbUrl: null,
  },
  {
    id: 'eggwars',
    tag: 'MODALIDAD_03',
    title: 'Eggwars',
    stat: 'HUEVO.RIVAL',
    description: 'El huevo rival, no la cama: rómpelo antes de que rompan el tuyo.',
    color: 0xf2c14e,
    glbUrl: null,
  },
  {
    id: 'lucky-islands',
    tag: 'MODALIDAD_04',
    title: 'Lucky Islands',
    stat: 'RNG.HIGH',
    description: 'Bloques de la suerte: pueden salvar la partida o arruinarla.',
    color: 0x7c2ae8,
    glbUrl: null,
  },
  {
    id: 'hunger-games',
    tag: 'MODALIDAD_05',
    title: 'Juegos del Hambre',
    stat: 'CIRCULO.CLOSE',
    description: 'Supervivencia entre varios, recursos limitados y el círculo que no perdona.',
    color: 0x5c8a3a,
    glbUrl: null,
  },
  {
    id: 'arena-pvp',
    tag: 'MODALIDAD_06',
    title: 'Arena PvP',
    stat: '1V1.DIRECT',
    description: 'Combate directo, sin vueltas: gana el que lee mejor al rival.',
    color: 0xec4038,
    glbUrl: null,
  },
];
