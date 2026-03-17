export type DevProject = {
  id: string;
  title: string;
  summary: string;
  stack: string;
  repoUrl: string;
  demoUrl: string;
  lookingFor: string;
  linkedIdeaIds: string[];
  status: "idea" | "building" | "live";
  author: string;
  updated: string;
  createdAt: string;
  ownerId: string | null;
};

export type DevProjectRow = {
  id: string;
  title: string;
  summary: string;
  stack: string;
  repo_url: string | null;
  demo_url: string | null;
  looking_for: string | null;
  status: "idea" | "building" | "live";
  author_handle: string | null;
  created_by: string;
  created_at: string;
};

export const DEV_PROJECTS_LS_KEY = "codevamp.dev.projects";
export const initialProjects: DevProject[] = [];

function formatUpdatedDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function mapDevProjectRow(row: DevProjectRow): DevProject {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    stack: row.stack,
    repoUrl: row.repo_url ?? "",
    demoUrl: row.demo_url ?? "",
    lookingFor: row.looking_for ?? "Open",
    linkedIdeaIds: [],
    status: row.status,
    author: row.author_handle ?? "",
    updated: formatUpdatedDate(row.created_at),
    createdAt: row.created_at,
    ownerId: row.created_by ?? null,
  };
}

export function normalizeDevProject(project: DevProject): DevProject {
  const createdAt = project.createdAt || new Date().toISOString();
  return {
    ...project,
    repoUrl: project.repoUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    lookingFor: project.lookingFor ?? "Open",
    linkedIdeaIds: Array.from(new Set((project.linkedIdeaIds ?? []).filter(Boolean))),
    author: project.author ?? "",
    updated: formatUpdatedDate(createdAt),
    createdAt,
    ownerId: project.ownerId ?? null,
  };
}

export function readLocalDevProjects(): DevProject[] {
  if (typeof window === "undefined") return initialProjects;
  try {
    const raw = window.localStorage.getItem(DEV_PROJECTS_LS_KEY);
    if (!raw) return initialProjects;
    const parsed = JSON.parse(raw) as DevProject[];
    if (!Array.isArray(parsed)) return initialProjects;
    return parsed.map(normalizeDevProject);
  } catch {
    return initialProjects;
  }
}

export function writeLocalDevProjects(projects: DevProject[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DEV_PROJECTS_LS_KEY,
      JSON.stringify(
        projects
          .map(normalizeDevProject)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  } catch {
    // ignore storage failures
  }
}

export function upsertLocalDevProject(project: DevProject): DevProject[] {
  const next = [
    normalizeDevProject(project),
    ...readLocalDevProjects().filter((item) => item.id !== project.id),
  ];
  writeLocalDevProjects(next);
  return next;
}

export function removeLocalDevProject(projectId: string): DevProject[] {
  const next = readLocalDevProjects().filter((item) => item.id !== projectId);
  writeLocalDevProjects(next);
  return next;
}

export function mergeDevProjectCatalogs(remoteProjects: DevProject[], localProjects: DevProject[]): DevProject[] {
  const merged = new Map<string, DevProject>();
  for (const project of localProjects.map(normalizeDevProject)) {
    merged.set(project.id, project);
  }
  for (const project of remoteProjects.map(normalizeDevProject)) {
    const local = merged.get(project.id);
    merged.set(project.id, local ? { ...project, linkedIdeaIds: local.linkedIdeaIds.length ? local.linkedIdeaIds : project.linkedIdeaIds } : project);
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
