export type FunnelStepId = "discover" | "publish" | "collaborate" | "retain";

export type FunnelStep = {
  id: FunnelStepId;
  labelEs: string;
  labelEn: string;
  descriptionEs: string;
  descriptionEn: string;
};

export const COMMON_FUNNEL: FunnelStep[] = [
  {
    id: "discover",
    labelEs: "Descubrir",
    labelEn: "Discover",
    descriptionEs: "Audiencia que conoce la subempresa.",
    descriptionEn: "Audience reached by the subcompany.",
  },
  {
    id: "publish",
    labelEs: "Publicar",
    labelEn: "Publish",
    descriptionEs: "Activos publicados en el producto.",
    descriptionEn: "Assets published in the product.",
  },
  {
    id: "collaborate",
    labelEs: "Colaborar",
    labelEn: "Collaborate",
    descriptionEs: "Personas activas contribuyendo al flujo.",
    descriptionEn: "Active people contributing to the flow.",
  },
  {
    id: "retain",
    labelEs: "Retener",
    labelEn: "Retain",
    descriptionEs: "Actividad sostenida en ventana reciente (30 dias).",
    descriptionEn: "Sustained activity in the recent window (30 days).",
  },
];

