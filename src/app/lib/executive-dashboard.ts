import { getBrandConfig } from "@/brands";
import { COMMON_FUNNEL, type FunnelStepId } from "@/shared/analytics/funnel";
import { devSupabase, supabase } from "./supabase";

type VisualesProject = {
  id: string;
  user_id: string | null;
  created_at: string | null;
};

type ProjectStatRow = {
  project_id: string;
  views_count: number | null;
  shares_count: number | null;
};

type DevProject = {
  id: string;
  created_by: string | null;
  looking_for: string | null;
  created_at: string | null;
};

type Membership = {
  product_slug: string | null;
  user_id: string | null;
};

export type BrandExecutiveSnapshot = {
  brandId: "dev" | "visuales";
  brandName: string;
  tagline: string;
  description: string;
  funnel: Record<FunnelStepId, number>;
  comparables: {
    audience: number;
    publishedAssets: number;
    activeContributors: number;
    recentActivity30d: number;
  };
};

export type ExecutiveDashboardData = {
  generatedAt: string;
  funnel: typeof COMMON_FUNNEL;
  snapshots: BrandExecutiveSnapshot[];
  coverage: {
    membershipsAvailable: boolean;
  };
};

const getRecentCutoff = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const isRecent = (value: string | null, cutoff: Date) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed >= cutoff;
};

const sum = (values: Array<number | null | undefined>) =>
  values.reduce<number>((acc, value) => acc + Number(value ?? 0), 0);

const uniqueCount = (values: Array<string | null | undefined>) => new Set(values.filter(Boolean) as string[]).size;

const indexMemberships = (rows: Membership[]) => {
  const map = new Map<string, Set<string>>();
  rows.forEach((row) => {
    const slug = row.product_slug?.trim();
    const userId = row.user_id?.trim();
    if (!slug || !userId) return;
    const set = map.get(slug) ?? new Set<string>();
    set.add(userId);
    map.set(slug, set);
  });
  return map;
};

export async function fetchExecutiveDashboardData(): Promise<ExecutiveDashboardData> {
  const cutoff = getRecentCutoff(30);

  const visualesPromise = supabase
    ? supabase.from("projects").select("id, user_id, created_at").limit(2000)
    : Promise.resolve({ data: null, error: { message: "supabase missing" } });

  const devPromise = devSupabase
    ? devSupabase.from("dev_projects").select("id, created_by, looking_for, created_at").limit(2000)
    : Promise.resolve({ data: null, error: { message: "dev supabase missing" } });

  const membershipsPromise = supabase
    ? supabase.from("product_memberships").select("product_slug, user_id").in("product_slug", ["dev", "visuales"]).limit(5000)
    : Promise.resolve({ data: null, error: { message: "supabase missing" } });

  const [visualesResult, devResult, membershipsResult] = await Promise.all([
    visualesPromise,
    devPromise,
    membershipsPromise,
  ]);

  const visualesProjects = (visualesResult.data as VisualesProject[] | null) ?? [];
  const devProjects = (devResult.data as DevProject[] | null) ?? [];

  let visualesViews = 0;
  if (supabase && visualesProjects.length > 0) {
    const projectIds = visualesProjects.map((row) => row.id).filter(Boolean);
    const { data: statRows } = await supabase
      .from("project_stats")
      .select("project_id, views_count, shares_count")
      .in("project_id", projectIds.slice(0, 2000));
    const stats = (statRows as ProjectStatRow[] | null) ?? [];
    visualesViews = sum(stats.map((row) => row.views_count));
  }

  const membershipsAvailable = !membershipsResult.error && Array.isArray(membershipsResult.data);
  const membershipIndex = membershipsAvailable ? indexMemberships((membershipsResult.data as Membership[]) ?? []) : new Map<string, Set<string>>();

  const visualesAudience = membershipsAvailable
    ? membershipIndex.get("visuales")?.size ?? 0
    : visualesViews;
  const devAudience = membershipsAvailable
    ? membershipIndex.get("dev")?.size ?? 0
    : uniqueCount(devProjects.map((row) => row.created_by));

  const devContributors = uniqueCount(devProjects.map((row) => row.created_by));
  const visualesContributors = uniqueCount(visualesProjects.map((row) => row.user_id));

  const devRecent = devProjects.filter((row) => isRecent(row.created_at, cutoff)).length;
  const visualesRecent = visualesProjects.filter((row) => isRecent(row.created_at, cutoff)).length;

  const devBrand = getBrandConfig("dev");
  const visualesBrand = getBrandConfig("visuales");

  const snapshots: BrandExecutiveSnapshot[] = [
    {
      brandId: "dev",
      brandName: devBrand.name,
      tagline: devBrand.tagline,
      description: devBrand.description,
      funnel: {
        discover: devAudience,
        publish: devProjects.length,
        collaborate: devContributors,
        retain: devRecent,
      },
      comparables: {
        audience: devAudience,
        publishedAssets: devProjects.length,
        activeContributors: devContributors,
        recentActivity30d: devRecent,
      },
    },
    {
      brandId: "visuales",
      brandName: visualesBrand.name,
      tagline: visualesBrand.tagline,
      description: visualesBrand.description,
      funnel: {
        discover: visualesAudience,
        publish: visualesProjects.length,
        collaborate: visualesContributors,
        retain: visualesRecent,
      },
      comparables: {
        audience: visualesAudience,
        publishedAssets: visualesProjects.length,
        activeContributors: visualesContributors,
        recentActivity30d: visualesRecent,
      },
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    funnel: COMMON_FUNNEL,
    snapshots,
    coverage: {
      membershipsAvailable,
    },
  };
}
