import { supabase } from "./supabase";

export type ProjectStats = {
  project_id: string;
  views_count: number;
  likes_count: number;
  shares_count: number;
  watch_seconds: number;
};

const EMPTY_STATS: Omit<ProjectStats, "project_id"> = {
  views_count: 0,
  likes_count: 0,
  shares_count: 0,
  watch_seconds: 0,
};

const normalizeRow = (row: Partial<ProjectStats> & { project_id: string }): ProjectStats => ({
  project_id: row.project_id,
  views_count: Number(row.views_count ?? 0),
  likes_count: Number(row.likes_count ?? 0),
  shares_count: Number(row.shares_count ?? 0),
  watch_seconds: Number(row.watch_seconds ?? 0),
});

export const fetchProjectStatsMap = async (projectIds: string[]): Promise<Record<string, ProjectStats>> => {
  if (!supabase || projectIds.length === 0) {
    return {};
  }
  const uniqueIds = Array.from(new Set(projectIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return {};
  }
  const { data, error } = await supabase
    .from("project_stats")
    .select("project_id, views_count, likes_count, shares_count, watch_seconds")
    .in("project_id", uniqueIds);

  if (error || !data) {
    return {};
  }
  return (data as Array<Partial<ProjectStats> & { project_id: string }>).reduce<Record<string, ProjectStats>>(
    (acc, row) => {
      acc[row.project_id] = normalizeRow(row);
      return acc;
    },
    {}
  );
};

export const getProjectStats = (statsMap: Record<string, ProjectStats>, projectId: string): ProjectStats => {
  return statsMap[projectId] ?? { project_id: projectId, ...EMPTY_STATS };
};

export const recordProjectView = async (projectId: string): Promise<void> => {
  if (!supabase || !projectId) {
    return;
  }
  await supabase.rpc("record_project_view", { p_project_id: projectId });
};

export const recordProjectShare = async (projectId: string): Promise<void> => {
  if (!supabase || !projectId) {
    return;
  }
  await supabase.rpc("record_project_share", { p_project_id: projectId });
};

export const formatCompactMetric = (value: number): string => {
  const next = Math.max(0, Number.isFinite(value) ? value : 0);
  return new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(next);
};

export const formatWatchHours = (seconds: number): string => {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  return `${(safeSeconds / 3600).toFixed(1)} h`;
};
