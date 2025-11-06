export type MobileLegendsExpertReview = {
  reviewer: string;
  specialization: string;
  focus: "Draft" | "Macro" | "Micro" | "Soporte" | "Rotaciones";
  rating: number;
  comment: string;
  createdAt: string;
};

export type MobileLegendsExpertFeedback = {
  hero: string;
  role: string;
  lane: string;
  headline: string;
  recommendation: string;
  priorityTags: string[];
  confidence: number;
  reviews: MobileLegendsExpertReview[];
};

export const mlbbExpertFeedback: MobileLegendsExpertFeedback[] = [
  {
    hero: "Khufra",
    role: "Tank",
    lane: "Roam",
    headline: "El guardián anti-dash sigue siendo clave en metas de movilidad",
    recommendation:
      "Sincroniza Bouncing Ball con engages enemigos y prioriza objetos de vida tempranos antes de ir por Dominance Ice.",
    priorityTags: ["Control", "Visión", "Setups"],
    confidence: 0.94,
    reviews: [
      {
        reviewer: "Coach V3NOM",
        specialization: "Head Coach · MPL MEX",
        focus: "Draft",
        rating: 4.8,
        comment: "Siguen baneando Khufra en scrims; cuando pasa, condiciona todo el draft rival.",
        createdAt: "2024-03-22T10:05:00Z",
      },
      {
        reviewer: "Analista Eris",
        specialization: "Scouting",
        focus: "Macro",
        rating: 4.6,
        comment: "Su control de visión con bombas cambia el ritmo de rotaciones tempranas.",
        createdAt: "2024-03-19T18:22:00Z",
      },
      {
        reviewer: "Roamer Kaze",
        specialization: "Jugador Mythic Immortal",
        focus: "Micro",
        rating: 4.9,
        comment: "Flicker + ultimate sigue siendo la mejor respuesta a line-ups con Wanwan o Claude.",
        createdAt: "2024-03-17T03:44:00Z",
      },
    ],
  },
  {
    hero: "Lancelot",
    role: "Assassin",
    lane: "Jungle",
    headline: "Requiere apoyo constante para ejecutar invasiones seguras",
    recommendation:
      "Coordina rutas agresivas solo si tu mid y roam pueden acompañar; de lo contrario prioriza farming hasta ítems principales.",
    priorityTags: ["Snowball", "Movilidad", "Invasión"],
    confidence: 0.88,
    reviews: [
      {
        reviewer: "Coach Atlas",
        specialization: "Estratega",
        focus: "Macro",
        rating: 4.2,
        comment: "Su techo es alto, pero sin prioridad de líneas se vuelve liability.",
        createdAt: "2024-03-20T15:14:00Z",
      },
      {
        reviewer: "Jungla Retsu",
        specialization: "Jugador profesional",
        focus: "Micro",
        rating: 4.7,
        comment: "Thorned Rose cancelada a tiempo sigue esquivando la mayoría de CC puntuales.",
        createdAt: "2024-03-18T09:33:00Z",
      },
      {
        reviewer: "Analista Lumi",
        specialization: "Data Analyst",
        focus: "Draft",
        rating: 4.1,
        comment: "Pick situacional: requiere peel adicional si lo llevas a composiciones sin frontline pesado.",
        createdAt: "2024-03-15T22:48:00Z",
      },
    ],
  },
  {
    hero: "Pharsa",
    role: "Mage",
    lane: "Mid",
    headline: "Controla mapas abiertos con definitiva de rango extremo",
    recommendation:
      "Prioriza la limpieza segura de oleadas antes de rotar y guarda una carga de ala para escapar de flancos.",
    priorityTags: ["Zonificación", "Rotaciones", "Defensa"],
    confidence: 0.82,
    reviews: [
      {
        reviewer: "Caster Nova",
        specialization: "Analista de broadcast",
        focus: "Draft",
        rating: 4.4,
        comment: "Su valor sube en mapas donde la toma de visión es compleja.",
        createdAt: "2024-03-19T01:18:00Z",
      },
      {
        reviewer: "Mid Laner Saya",
        specialization: "Jugadora competitiva",
        focus: "Micro",
        rating: 4.5,
        comment: "Entra y sale rápido: la forma de ave sigue siendo imprescindible para rotar segura.",
        createdAt: "2024-03-17T17:09:00Z",
      },
      {
        reviewer: "Coach Delta",
        specialization: "Head Coach",
        focus: "Macro",
        rating: 4.3,
        comment: "Feathered Air Strike controla objetivos neutrales incluso cuando vas por detrás.",
        createdAt: "2024-03-14T12:33:00Z",
      },
    ],
  },
  {
    hero: "Beatrix",
    role: "Marksman",
    lane: "Gold",
    headline: "El dominio del swap de armas define su impacto mid game",
    recommendation:
      "Practica combos Renner → Nibiru y aprovecha el rango para castigar sin exponerte; ajusta build según frontline rival.",
    priorityTags: ["Burst", "Flex", "Wave clear"],
    confidence: 0.9,
    reviews: [
      {
        reviewer: "Coach Rina",
        specialization: "Especialista en tiradores",
        focus: "Micro",
        rating: 4.9,
        comment: "El timing del reload manual sigue ganando peleas en el minuto 8.",
        createdAt: "2024-03-21T21:46:00Z",
      },
      {
        reviewer: "Gold Laner Hux",
        specialization: "Jugador profesional",
        focus: "Draft",
        rating: 4.4,
        comment: "Necesita soporte con peel fuerte; sin eso cae frente a asesinos.",
        createdAt: "2024-03-18T07:55:00Z",
      },
      {
        reviewer: "Analista Vega",
        specialization: "Analista de datos",
        focus: "Macro",
        rating: 4.6,
        comment: "En scrims domina cuando se priorizan objetivos cruzados con su rango.",
        createdAt: "2024-03-16T11:28:00Z",
      },
    ],
  },
  {
    hero: "Estes",
    role: "Support",
    lane: "Roam",
    headline: "La pieza que estabiliza composiciones front-to-back",
    recommendation:
      "Coordina con tu tirador para mantener el aura activa y reserva ultimate para contrarrestar burst masivo.",
    priorityTags: ["Sostenimiento", "Protección", "Teamfight"],
    confidence: 0.86,
    reviews: [
      {
        reviewer: "Coach Nyx",
        specialization: "Coaching de soportes",
        focus: "Soporte",
        rating: 4.5,
        comment: "Su presencia obliga a los rivales a rushear Dominance Ice.",
        createdAt: "2024-03-20T19:12:00Z",
      },
      {
        reviewer: "Support Lia",
        specialization: "Jugadora competitiva",
        focus: "Micro",
        rating: 4.7,
        comment: "Las trayectorias de sanación definen peleas: mapa tus rotaciones antes de salir de base.",
        createdAt: "2024-03-17T05:58:00Z",
      },
      {
        reviewer: "Caster Ro",
        specialization: "Observador",
        focus: "Macro",
        rating: 4.3,
        comment: "El meta necesita sostenimiento prolongado; Estes brilla en peleas extendidas.",
        createdAt: "2024-03-15T16:40:00Z",
      },
    ],
  },
  {
    hero: "Yve",
    role: "Mage",
    lane: "Mid",
    headline: "Zonas de control perfectas para peel defensivo",
    recommendation:
      "Define desde draft quién protege tu canalización y coordina Starfield para cubrir objetivos mayores.",
    priorityTags: ["Control", "Teamfight", "Utility"],
    confidence: 0.92,
    reviews: [
      {
        reviewer: "Coach Magus",
        specialization: "Strategist",
        focus: "Draft",
        rating: 4.6,
        comment: "Gran respuesta a assassins cuando tienes frontline con lockdown.",
        createdAt: "2024-03-22T08:20:00Z",
      },
      {
        reviewer: "Mid Laner Aya",
        specialization: "Jugadora profesional",
        focus: "Micro",
        rating: 4.8,
        comment: "La gestión de cuadrados y líneas sigue definiendo si ganas o pierdes la teamfight.",
        createdAt: "2024-03-19T13:37:00Z",
      },
      {
        reviewer: "Analista Sol",
        specialization: "Data analyst",
        focus: "Macro",
        rating: 4.5,
        comment: "Su winrate subió 6 puntos en scrims tras el último parche, especialmente con Atlas.",
        createdAt: "2024-03-16T10:54:00Z",
      },
    ],
  },
];
