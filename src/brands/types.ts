export type BrandId = "codevamp" | "dev" | "visuales" | "audio" | "prototipos";

export type BrandPalette = {
  primary: string;
  primaryStrong: string;
  neutralLight: string;
  neutralDark: string;
};

export type BrandLink = {
  href: string;
  label: string;
};

export type BrandConfig = {
  id: BrandId;
  name: string;
  basePath: string;
  tagline: string;
  description: string;
  unitType: "core" | "subcompany";
  parentId?: BrandId;
  identity: {
    mission: string;
    voice: string;
  };
  palette: BrandPalette;
  quickLinks: BrandLink[];
  homeTileRoutes: Record<string, string>;
};
