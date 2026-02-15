import { BRAND_CATALOG } from "./catalog";
import type { BrandConfig, BrandId } from "./types";

export const DEFAULT_BRAND_ID: BrandId = "codevamp";

export function getBrandConfig(id: BrandId): BrandConfig {
  return BRAND_CATALOG[id];
}

export function getBrandByPath(pathname: string): BrandConfig {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith("/visuales")) {
    return BRAND_CATALOG.visuales;
  }
  if (normalized.startsWith("/audio")) {
    return BRAND_CATALOG.audio;
  }
  return BRAND_CATALOG[DEFAULT_BRAND_ID];
}

export type { BrandConfig, BrandId } from "./types";
