export type MlbbPatchEntry = {
  version: string;
  date: string;
  theme: string;
  highlights: string[];
};

export const mlbbPatchHistory: MlbbPatchEntry[] = [
  {
    version: "1.8.20",
    date: "2023",
    theme: "Roles de soporte recortados",
    highlights: [
      "Akai, Atlas, Franco, Khufra y Tigreal dejan de listar Soporte como rol secundario.",
      "Nana se consolida como maga pura sin etiqueta de soporte.",
    ],
  },
  {
    version: "1.6.84",
    date: "24 mayo 2022",
    theme: "Llegada de Julian y balance MPL",
    highlights: [
      "Julian debuta como luchador/mago sin definitiva, completando Forsaken Light.",
      "Ajustes de balance para Irithel, Thamuz, Akai y otros héroes enfocados en DPS sostenido.",
      "Eventos especiales: colaboración Transformers y pase MSC con nuevas recompensas.",
    ],
  },
  {
    version: "1.6.66",
    date: "2022",
    theme: "Masha reforzada",
    highlights: [
      "Masha obtiene rol secundario de tanque, ampliando su uso en la EXP Lane.",
    ],
  },
  {
    version: "1.6.26",
    date: "2021",
    theme: "Roles híbridos para Bane",
    highlights: [
      "Bane pasa a ser Luchador/Mago, habilitando builds mixtas de burst y empuje.",
    ],
  },
  {
    version: "1.6.18",
    date: "2021",
    theme: "Tanques soporte y ajustes de YSS",
    highlights: [
      "Akai, Tigreal, Atlas, Khufra y Franco suman el rol de soporte para reflejar su utilidad.",
      "Yi Sun-shin invierte su orden de roles a Asesino/Francotirador.",
    ],
  },
  {
    version: "1.6.10",
    date: "2021",
    theme: "Especialidades mágicas actualizadas",
    highlights: [
      "Kimmy se redefine como Daño/Magia para sus proyectiles híbridos.",
      "Natan adopta el enfoque de Burst/Magia para potenciar su clon.",
    ],
  },
  {
    version: "1.5.46",
    date: "2021",
    theme: "Ajustes de roles clásicos",
    highlights: [
      "Balmond y Masha dejan el rol de tanque para centrarse en su faceta de luchador.",
      "Lapu-Lapu deja de compartir la etiqueta de asesino.",
    ],
  },
  {
    version: "1.4.94",
    date: "2020",
    theme: "Reforma de especialidades",
    highlights: [
      "Se agregan nuevas etiquetas: Magic Damage, Mixed Damage, Control, Chase, Guard y Support.",
      "Especialidades actualizadas para más de 40 héroes, incluyendo Bruno, Clint, Layla y Selena.",
      "Karina, Guinevere y Gusion enfatizan su daño mágico dentro de la clasificación revisada.",
    ],
  },
  {
    version: "1.4.86-1.4.44",
    date: "2020",
    theme: "Expansión de roles duales",
    highlights: [
      "Gatotkaca y Ruby reciben rol dual de tanque, mientras Silvanna y Harley suman etiquetas mágicas/asesinas.",
    ],
  },
  {
    version: "2019-2016",
    date: "2019-2016",
    theme: "Cambios tempranos de identidad",
    highlights: [
      "Kaja alterna entre soporte, luchador y tanque antes de fijarse como soporte/luchador.",
      "Masha oscila entre luchador y tanque según la versión del parche.",
      "Franco evoluciona de luchador a tanque en los primeros parches documentados.",
    ],
  },
];
