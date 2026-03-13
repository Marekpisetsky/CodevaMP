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

export const initialProjects: DevProject[] = [];

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
    updated: new Date(row.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    createdAt: row.created_at,
    ownerId: row.created_by ?? null,
  };
}
