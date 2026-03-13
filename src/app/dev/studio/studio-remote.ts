"use client";

import { devSupabase as supabase } from "@/app/lib/supabase";
import {
  STUDIO_REMOTE_MAX_COMMIT_BYTES,
  STUDIO_REMOTE_RETENTION,
  buildInitialHistories,
  estimateWorkspaceBytes,
  formatProjectTitleFromId,
  normalizePath,
  readLocalRemoteCommits,
  toPreviewDocument,
  writeLocalRemoteCommits,
  type StackKey,
  type StudioRemoteCommit,
} from "./studio-core";

type PushTerminal = (message: string) => void;
type Tx = (es: string, en: string) => string;

function mapRowToCommit(row: Record<string, unknown>, fallbackStack: StackKey, fallbackBranch: string): StudioRemoteCommit {
  return {
    id: (row.id as string) || `${Date.now().toString(36)}-fallback`,
    message: (row.message as string) || "Checkpoint",
    createdAt: (row.created_at as string) || new Date().toISOString(),
    stack: ((row.stack as StackKey) || fallbackStack),
    branch: (row.branch as string) || fallbackBranch,
    files: (row.files as Record<string, string>) || {},
    folderPaths: (row.folder_paths as string[]) || [],
    activeFile: (row.active_file as string) || "",
    dependencies: (row.dependencies as string[]) || [],
  };
}

export async function loadCodevampRemoteCommitsOperation(args: {
  projectIdValue?: string;
  branchValue?: string;
  remoteProjectId: string;
  remoteWorkspaceBranch: string;
  stack: StackKey;
  sessionUserId: string | null | undefined;
  setRemoteStatus: (value: "cloud" | "local") => void;
  setRemoteCommits: (value: StudioRemoteCommit[]) => void;
  setRemoteMainHead: (value: StudioRemoteCommit | null) => void;
}) {
  const {
    projectIdValue,
    branchValue,
    remoteProjectId,
    remoteWorkspaceBranch,
    stack,
    sessionUserId,
    setRemoteStatus,
    setRemoteCommits,
    setRemoteMainHead,
  } = args;

  const projectId = normalizePath(projectIdValue || remoteProjectId) || `dev-${stack}`;
  const branch = normalizePath(branchValue || remoteWorkspaceBranch) || "main";

  if (!supabase || !sessionUserId) {
    setRemoteStatus("local");
    const localBranchCommits = readLocalRemoteCommits(projectId, branch);
    setRemoteCommits(localBranchCommits);
    setRemoteMainHead(branch === "main" ? (localBranchCommits[0] ?? null) : (readLocalRemoteCommits(projectId, "main")[0] ?? null));
    return;
  }

  try {
    const { data, error } = await supabase
      .from("dev_studio_commits")
      .select("id,project_id,branch,stack,message,files,folder_paths,active_file,dependencies,created_at")
      .eq("user_id", sessionUserId)
      .eq("project_id", projectId)
      .eq("branch", branch)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error || !data) {
      setRemoteStatus("local");
      const localBranchCommits = readLocalRemoteCommits(projectId, branch);
      setRemoteCommits(localBranchCommits);
      setRemoteMainHead(branch === "main" ? (localBranchCommits[0] ?? null) : (readLocalRemoteCommits(projectId, "main")[0] ?? null));
      return;
    }

    const mapped = data.map((row) => mapRowToCommit(row as Record<string, unknown>, stack, branch));
    setRemoteStatus("cloud");
    setRemoteCommits(mapped);

    if (branch === "main") {
      setRemoteMainHead(mapped[0] ?? null);
      return;
    }

    const { data: mainData } = await supabase
      .from("dev_studio_commits")
      .select("id,project_id,branch,stack,message,files,folder_paths,active_file,dependencies,created_at")
      .eq("user_id", sessionUserId)
      .eq("project_id", projectId)
      .eq("branch", "main")
      .order("created_at", { ascending: false })
      .limit(1);

    setRemoteMainHead(mainData?.[0] ? mapRowToCommit(mainData[0] as Record<string, unknown>, stack, "main") : null);
  } catch {
    setRemoteStatus("local");
    const localBranchCommits = readLocalRemoteCommits(projectId, branch);
    setRemoteCommits(localBranchCommits);
    setRemoteMainHead(branch === "main" ? (localBranchCommits[0] ?? null) : (readLocalRemoteCommits(projectId, "main")[0] ?? null));
  }
}

export async function commitToCodevampRemoteOperation(args: {
  messageOverride?: string;
  remoteProjectId: string;
  remoteWorkspaceBranch: string;
  remoteCommitMessage: string;
  stack: StackKey;
  files: Record<string, string>;
  folderPaths: string[];
  activeFile: string;
  dependencies: string[];
  sessionUserId: string | null | undefined;
  remoteCommits: StudioRemoteCommit[];
  setRemoteStatus: (value: "cloud" | "local") => void;
  setRemoteCommits: (value: StudioRemoteCommit[]) => void;
  setRemoteCommitMessage: (value: string) => void;
  pushTerminal: PushTerminal;
}) {
  const {
    messageOverride,
    remoteProjectId,
    remoteWorkspaceBranch,
    remoteCommitMessage,
    stack,
    files,
    folderPaths,
    activeFile,
    dependencies,
    sessionUserId,
    remoteCommits,
    setRemoteStatus,
    setRemoteCommits,
    setRemoteCommitMessage,
    pushTerminal,
  } = args;

  const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
  const branch = normalizePath(remoteWorkspaceBranch) || "main";
  const message = (messageOverride ?? remoteCommitMessage).trim() || `Checkpoint ${new Date().toLocaleString("en-US", { hour12: false })}`;
  const messageSafe = message.slice(0, 180);
  const payloadBytes = estimateWorkspaceBytes({ files, folderPaths, activeFile, dependencies });
  if (payloadBytes > STUDIO_REMOTE_MAX_COMMIT_BYTES) {
    const mb = (payloadBytes / 1024 / 1024).toFixed(2);
    pushTerminal(`commit blocked: workspace too large (${mb}MB). Limit ${(STUDIO_REMOTE_MAX_COMMIT_BYTES / 1024 / 1024).toFixed(2)}MB.`);
    return;
  }

  const commit: StudioRemoteCommit = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    message: messageSafe,
    createdAt: new Date().toISOString(),
    stack,
    branch,
    files,
    folderPaths,
    activeFile,
    dependencies,
  };

  if (supabase && sessionUserId) {
    const { data, error } = await supabase
      .from("dev_studio_commits")
      .insert({
        user_id: sessionUserId,
        project_id: projectId,
        branch,
        stack,
        message: messageSafe,
        files: commit.files,
        folder_paths: commit.folderPaths,
        active_file: commit.activeFile,
        dependencies: commit.dependencies,
      })
      .select("id,message,created_at")
      .single();

    if (error) {
      const errMsg = [error.code, error.message, error.details, error.hint].filter(Boolean).join(" | ");
      pushTerminal(`cloud commit failed, saved local fallback: ${errMsg}`);
      const next = [commit, ...readLocalRemoteCommits(projectId, branch)].slice(0, STUDIO_REMOTE_RETENTION);
      writeLocalRemoteCommits(projectId, branch, next);
      setRemoteStatus("local");
      setRemoteCommits(next);
    } else {
      const cloudCommit: StudioRemoteCommit = {
        ...commit,
        id: (data?.id as string) || commit.id,
        message: (data?.message as string) || message,
        createdAt: (data?.created_at as string) || commit.createdAt,
      };
      const next = [cloudCommit, ...remoteCommits].slice(0, STUDIO_REMOTE_RETENTION);
      setRemoteStatus("cloud");
      setRemoteCommits(next);
      pushTerminal(`CodevaMP cloud commit created: ${cloudCommit.id} (${projectId}@${branch})`);

      const { data: oldRows } = await supabase
        .from("dev_studio_commits")
        .select("id")
        .eq("user_id", sessionUserId)
        .eq("project_id", projectId)
        .eq("branch", branch)
        .order("created_at", { ascending: false })
        .range(STUDIO_REMOTE_RETENTION, STUDIO_REMOTE_RETENTION + 300);

      if (oldRows?.length) {
        const oldIds = oldRows.map((row) => row.id as string).filter(Boolean);
        if (oldIds.length) {
          await supabase.from("dev_studio_commits").delete().in("id", oldIds);
          pushTerminal(`retention cleanup: removed ${oldIds.length} old commits`);
        }
      }
    }
  } else {
    const next = [commit, ...readLocalRemoteCommits(projectId, branch)].slice(0, STUDIO_REMOTE_RETENTION);
    writeLocalRemoteCommits(projectId, branch, next);
    setRemoteStatus("local");
    setRemoteCommits(next);
    pushTerminal(`CodevaMP local commit created: ${commit.id} (${projectId}@${branch})`);
  }

  setRemoteCommitMessage("");
}

export async function restoreCodevampCommitOperation(args: {
  commitId?: string;
  remoteProjectId: string;
  remoteWorkspaceBranch: string;
  stack: StackKey;
  sessionUserId: string | null | undefined;
  remoteCommits: StudioRemoteCommit[];
  files: Record<string, string>;
  folderPaths: string[];
  activeFile: string;
  dependencies: string[];
  pushUndo: (label: string, files: Record<string, string>, folderPaths: string[], activeFile: string, dependencies: string[]) => void;
  setFiles: (value: Record<string, string>) => void;
  setFolderPaths: (value: string[]) => void;
  setActiveFile: (value: string) => void;
  setDependencies: (value: string[]) => void;
  setCodeHistories: (value: ReturnType<typeof buildInitialHistories>) => void;
  setPreviewDoc: (value: string) => void;
  pushTerminal: PushTerminal;
}) {
  const {
    commitId,
    remoteProjectId,
    remoteWorkspaceBranch,
    stack,
    sessionUserId,
    remoteCommits,
    files,
    folderPaths,
    activeFile,
    dependencies,
    pushUndo,
    setFiles,
    setFolderPaths,
    setActiveFile,
    setDependencies,
    setCodeHistories,
    setPreviewDoc,
    pushTerminal,
  } = args;

  const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
  const branch = normalizePath(remoteWorkspaceBranch) || "main";
  const rows = supabase && sessionUserId ? remoteCommits : readLocalRemoteCommits(projectId, branch);
  const target = commitId ? rows.find((row) => row.id === commitId) : rows[0];
  if (!target) {
    pushTerminal("no commit found to restore");
    return;
  }
  pushUndo(`restore commit ${target.id}`, files, folderPaths, activeFile, dependencies);
  setFiles(target.files);
  setFolderPaths(target.folderPaths);
  setActiveFile(target.activeFile in target.files ? target.activeFile : Object.keys(target.files)[0] ?? "");
  setDependencies(target.dependencies);
  setCodeHistories(buildInitialHistories(target.files));
  setPreviewDoc(toPreviewDocument(target.files, target.dependencies));
  pushTerminal(`restored commit ${target.id} (${projectId}@${branch})`);
}

export async function createOrSwitchRemoteBranchOperation(args: {
  branchOverride?: string;
  remoteProjectId: string;
  remoteWorkspaceBranch: string;
  remoteNewBranch: string;
  stack: StackKey;
  setRemoteWorkspaceBranch: (value: string) => void;
  setRemoteNewBranch: (value: string) => void;
  loadCodevampRemoteCommits: (projectIdValue?: string, branchValue?: string) => Promise<void>;
  pushTerminal: PushTerminal;
}) {
  const { branchOverride, remoteProjectId, remoteWorkspaceBranch, remoteNewBranch, stack, setRemoteWorkspaceBranch, setRemoteNewBranch, loadCodevampRemoteCommits, pushTerminal } = args;
  const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
  const nextBranch = normalizePath(branchOverride || remoteNewBranch || remoteWorkspaceBranch) || "main";
  setRemoteWorkspaceBranch(nextBranch);
  setRemoteNewBranch("");
  await loadCodevampRemoteCommits(projectId, nextBranch);
  pushTerminal(`CodevaMP branch active: ${projectId}@${nextBranch}`);
}

export async function mergeCurrentBranchIntoMainOperation(args: {
  remoteProjectId: string;
  remoteWorkspaceBranch: string;
  stack: StackKey;
  remoteCommits: StudioRemoteCommit[];
  sessionUserId: string | null | undefined;
  setRemoteMergeBusy: (value: boolean) => void;
  loadCodevampRemoteCommits: (projectIdValue?: string, branchValue?: string) => Promise<void>;
  pushTerminal: PushTerminal;
}) {
  const { remoteProjectId, remoteWorkspaceBranch, stack, remoteCommits, sessionUserId, setRemoteMergeBusy, loadCodevampRemoteCommits, pushTerminal } = args;
  const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
  const sourceBranch = normalizePath(remoteWorkspaceBranch) || "main";
  if (sourceBranch === "main") {
    pushTerminal("already on main; merge skipped");
    return;
  }
  const sourceCommit = remoteCommits[0];
  if (!sourceCommit) {
    pushTerminal("no source commit to merge");
    return;
  }

  const confirmWord = window.prompt(`Type MERGE to merge ${sourceBranch} into main`);
  if (confirmWord !== "MERGE") {
    pushTerminal("merge cancelled");
    return;
  }

  setRemoteMergeBusy(true);
  try {
    const mergeMessage = `merge ${sourceBranch} -> main: ${sourceCommit.message}`;
    if (supabase && sessionUserId) {
      const { error } = await supabase.from("dev_studio_commits").insert({
        user_id: sessionUserId,
        project_id: projectId,
        branch: "main",
        stack: sourceCommit.stack,
        message: mergeMessage,
        files: sourceCommit.files,
        folder_paths: sourceCommit.folderPaths,
        active_file: sourceCommit.activeFile,
        dependencies: sourceCommit.dependencies,
      });
      if (error) {
        pushTerminal(`merge failed: ${error.message}`);
        return;
      }
    } else {
      const merged: StudioRemoteCommit = {
        ...sourceCommit,
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        branch: "main",
        message: mergeMessage,
        createdAt: new Date().toISOString(),
      };
      const nextMain = [merged, ...readLocalRemoteCommits(projectId, "main")].slice(0, STUDIO_REMOTE_RETENTION);
      writeLocalRemoteCommits(projectId, "main", nextMain);
    }
    pushTerminal(`merged ${sourceBranch} -> main`);
    await loadCodevampRemoteCommits(projectId, sourceBranch);
  } finally {
    setRemoteMergeBusy(false);
  }
}

export async function publishCurrentWorkspaceToDevOperation(args: {
  remoteWorkspaceBranch: string;
  remoteProjectId: string;
  stack: StackKey;
  templateLabel: string;
  remoteCommits: StudioRemoteCommit[];
  setRemotePublishBusy: (value: boolean) => void;
  setRemotePublishNote: (value: string | null) => void;
  pushTerminal: PushTerminal;
  tx: Tx;
  navigateToPublished: (id: string) => void;
}) {
  const {
    remoteWorkspaceBranch,
    remoteProjectId,
    stack,
    templateLabel,
    remoteCommits,
    setRemotePublishBusy,
    setRemotePublishNote,
    pushTerminal,
    tx,
    navigateToPublished,
  } = args;

  if (!supabase) {
    pushTerminal("publish failed: supabase not configured");
    setRemotePublishNote(tx("Supabase no configurado.", "Supabase is not configured."));
    return;
  }

  const branch = normalizePath(remoteWorkspaceBranch) || "main";
  if (branch !== "main") {
    pushTerminal("publish blocked: switch to main branch first");
    setRemotePublishNote(tx("Publica desde main para evitar inconsistencias.", "Publish from main to avoid inconsistencies."));
    return;
  }

  setRemotePublishBusy(true);
  setRemotePublishNote(null);
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      pushTerminal("publish failed: login required");
      setRemotePublishNote(tx("Inicia sesion para publicar en /dev.", "Sign in to publish in /dev."));
      return;
    }

    const user = authData.user;
    const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
    const title = formatProjectTitleFromId(projectId);
    const latest = remoteCommits[0];
    const summary = latest?.message
      ? `Workspace ${projectId}. Ultimo commit: ${latest.message}.`
      : `Workspace ${projectId} publicado desde Dev Studio.`;
    const demoUrl = `/dev/studio?stack=${encodeURIComponent(stack)}`;
    const authorRaw = (user.user_metadata?.username as string | undefined)?.trim();
    const author = authorRaw ? (authorRaw.startsWith("@") ? authorRaw : `@${authorRaw}`) : "@tu";

    const { data: existing, error: existingError } = await supabase
      .from("dev_projects")
      .select("id")
      .eq("created_by", user.id)
      .eq("title", title)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      pushTerminal(`publish failed: ${existingError.message}`);
      setRemotePublishNote(tx("No se pudo verificar si ya existe.", "Could not verify whether it already exists."));
      return;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("dev_projects")
        .update({
          summary,
          stack: templateLabel,
          demo_url: demoUrl,
          looking_for: "Colaboradores",
          status: "building",
          author_handle: author,
        })
        .eq("id", existing.id);
      if (updateError) {
        pushTerminal(`publish update failed: ${updateError.message}`);
        setRemotePublishNote(tx("No se pudo actualizar el proyecto.", "Could not update the project."));
        return;
      }
      pushTerminal(`published to /dev: updated ${existing.id}`);
      setRemotePublishNote(tx("Proyecto actualizado en /dev.", "Project updated in /dev."));
      navigateToPublished(existing.id);
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("dev_projects")
      .insert({
        title,
        summary,
        stack: templateLabel,
        repo_url: null,
        demo_url: demoUrl,
        looking_for: "Colaboradores",
        status: "building",
        author_handle: author,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      pushTerminal(`publish insert failed: ${insertError?.message || "unknown"}`);
      setRemotePublishNote(tx("No se pudo crear el proyecto.", "Could not create the project."));
      return;
    }

    pushTerminal(`published to /dev: created ${title}`);
    setRemotePublishNote(tx("Proyecto publicado en /dev.", "Project published in /dev."));
    navigateToPublished(inserted.id);
  } finally {
    setRemotePublishBusy(false);
  }
}
