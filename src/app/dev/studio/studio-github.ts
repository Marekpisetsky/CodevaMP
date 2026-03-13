"use client";

import {
  buildInitialHistories,
  encodePathForGithub,
  normalizePath,
  parentFolders,
  parseGithubRepoUrl,
  toBase64Utf8,
} from "./studio-core";

type PushTerminal = (message: string) => void;

export function promptAndOpenGithubDev(pushTerminal: PushTerminal) {
  const repoUrl = window.prompt("GitHub repo URL (https://github.com/owner/repo)");
  if (!repoUrl) return;
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    pushTerminal("invalid GitHub URL");
    return;
  }
  window.open(`https://github.dev/${parsed.owner}/${parsed.repo}`, "_blank", "noopener,noreferrer");
  pushTerminal(`opened github.dev: ${parsed.owner}/${parsed.repo}`);
}

export function openGithubDevFromRepoUrl(repoUrl: string, pushTerminal: PushTerminal, fallback: () => void) {
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    fallback();
    return;
  }
  window.open(`https://github.dev/${parsed.owner}/${parsed.repo}`, "_blank", "noopener,noreferrer");
  pushTerminal(`opened github.dev: ${parsed.owner}/${parsed.repo}`);
}

export function ensureGithubToken(
  currentValue: string,
  setValue: (value: string) => void,
  pushTerminal: PushTerminal,
  reason: "verify" | "push"
) {
  const current = currentValue.trim();
  if (current) return current;
  const message =
    reason === "verify"
      ? "Paste your GitHub token to verify repository ownership before push."
      : "Paste your GitHub token to push changes.";
  const provided = window.prompt(message) ?? "";
  const token = provided.trim();
  if (!token) {
    pushTerminal("github token required");
    return "";
  }
  setValue(token);
  return token;
}

export async function verifyGithubRepoOperation(args: {
  repoUrl: string;
  githubTokenInput: string;
  setGithubTokenInput: (value: string) => void;
  setRepoVerified: (value: boolean) => void;
  setRepoOwnerMatch: (value: boolean) => void;
  setVerifiedRepoUrl: (value: string) => void;
  setRepoVerificationNote: (value: string) => void;
  pushTerminal: PushTerminal;
}) {
  const { repoUrl, githubTokenInput, setGithubTokenInput, setRepoVerified, setRepoOwnerMatch, setVerifiedRepoUrl, setRepoVerificationNote, pushTerminal } = args;
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    setRepoVerified(false);
    setRepoOwnerMatch(false);
    setVerifiedRepoUrl("");
    setRepoVerificationNote("Invalid GitHub URL.");
    pushTerminal("invalid GitHub URL");
    return;
  }
  const { owner, repo } = parsed;
  pushTerminal(`verifying ${owner}/${repo} ...`);
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
      setRepoVerified(false);
      setRepoOwnerMatch(false);
      setVerifiedRepoUrl("");
      setRepoVerificationNote(`Repo not accessible (${repoRes.status}).`);
      return;
    }
    setRepoVerified(true);
    setVerifiedRepoUrl(repoUrl.trim());
    const token = ensureGithubToken(githubTokenInput, setGithubTokenInput, pushTerminal, "verify");
    if (!token) {
      setRepoOwnerMatch(false);
      setRepoVerificationNote("Ownership check requires GitHub token.");
      return;
    }
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!userRes.ok) {
      setRepoOwnerMatch(false);
      setRepoVerificationNote(`Token cannot read user (${userRes.status}).`);
      return;
    }
    const userData = (await userRes.json()) as { login?: string };
    const viewer = (userData.login || "").toLowerCase();
    const isOwner = viewer === owner.toLowerCase();
    setRepoOwnerMatch(isOwner);
    setRepoVerificationNote(isOwner ? `Verified owner: @${viewer}` : `Owner mismatch: repo owner @${owner}, connected @${viewer}`);
  } catch {
    setRepoVerified(false);
    setRepoOwnerMatch(false);
    setVerifiedRepoUrl("");
    setRepoVerificationNote("Verification failed.");
  }
}

export async function pullGithubRepoIntoWorkspaceOperation(args: {
  repoUrl: string;
  branchOverride?: string;
  files: Record<string, string>;
  folderPaths: string[];
  activeFile: string;
  dependencies: string[];
  pushTerminal: PushTerminal;
  pushUndo: (label: string, files: Record<string, string>, folderPaths: string[], activeFile: string, dependencies: string[]) => void;
  setFiles: (files: Record<string, string>) => void;
  setFolderPaths: (paths: string[]) => void;
  setCodeHistories: (value: ReturnType<typeof buildInitialHistories>) => void;
  setActiveFile: (value: string) => void;
  setRepoVerificationNote: (value: string) => void;
}) {
  const { repoUrl, branchOverride, files, folderPaths, activeFile, dependencies, pushTerminal, pushUndo, setFiles, setFolderPaths, setCodeHistories, setActiveFile, setRepoVerificationNote } = args;
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    pushTerminal("invalid GitHub URL");
    return;
  }
  const { owner, repo } = parsed;
  pushTerminal(`pulling ${owner}/${repo} ...`);
  try {
    const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoMetaRes.ok) {
      pushTerminal(`failed repo meta: ${repoMetaRes.status}`);
      return;
    }
    const repoMeta = (await repoMetaRes.json()) as { default_branch?: string };
    const branch = branchOverride || repoMeta.default_branch || "main";
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!treeRes.ok) {
      pushTerminal(`failed tree: ${treeRes.status}`);
      return;
    }
    const treeData = (await treeRes.json()) as { tree?: Array<{ path: string; type: string; size?: number }> };
    const blobs = (treeData.tree ?? [])
      .filter((entry) => entry.type === "blob")
      .filter((entry) => (entry.size ?? 0) <= 450_000)
      .slice(0, 140);
    if (!blobs.length) {
      pushTerminal("repo has no importable files");
      return;
    }
    const repoRoot = normalizePath(repo);
    const nextFiles = { ...files };
    const nextFolders = new Set(folderPaths);
    nextFolders.add(repoRoot);
    let importedCount = 0;
    for (const blob of blobs) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${blob.path}`;
      const fileRes = await fetch(rawUrl);
      if (!fileRes.ok) continue;
      const contentType = fileRes.headers.get("content-type") || "";
      if (!contentType.includes("text") && !contentType.includes("json") && !contentType.includes("javascript") && !contentType.includes("xml")) continue;
      const content = await fileRes.text();
      const path = normalizePath(`${repoRoot}/${blob.path}`);
      nextFiles[path] = content;
      parentFolders(path).forEach((folder) => nextFolders.add(folder));
      importedCount += 1;
    }
    if (!importedCount) {
      pushTerminal("no text files imported (binary-only repo?)");
      return;
    }
    pushUndo(`pull github ${owner}/${repo}`, files, folderPaths, activeFile, dependencies);
    setFiles(nextFiles);
    setFolderPaths(Array.from(nextFolders));
    setCodeHistories(buildInitialHistories(nextFiles));
    setActiveFile(Object.keys(nextFiles)[0] ?? activeFile);
    pushTerminal(`imported ${importedCount} files into /${repoRoot}`);
    setRepoVerificationNote("Pull complete. Connect GitHub + Verify ownership only when you need push.");
  } catch {
    pushTerminal("github pull failed");
  }
}

export async function pushWorkspaceToGithubOperation(args: {
  repoUrl: string;
  branchOverride?: string;
  remoteBranch: string;
  repoVerified: boolean;
  verifiedRepoUrl: string;
  repoOwnerMatch: boolean;
  githubTokenInput: string;
  setGithubTokenInput: (value: string) => void;
  files: Record<string, string>;
  pushTerminal: PushTerminal;
}) {
  const { repoUrl, branchOverride, remoteBranch, repoVerified, verifiedRepoUrl, repoOwnerMatch, githubTokenInput, setGithubTokenInput, files, pushTerminal } = args;
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    pushTerminal("invalid GitHub URL");
    return;
  }
  if (!repoVerified || verifiedRepoUrl !== repoUrl.trim()) {
    pushTerminal("verify repo first");
    return;
  }
  const token = ensureGithubToken(githubTokenInput, setGithubTokenInput, pushTerminal, "push");
  if (!token) return;
  if (!repoOwnerMatch) {
    pushTerminal("push blocked: this repository belongs to another owner. Create your own repo.");
    return;
  }
  const confirmWord = window.prompt("Type PUSH to confirm repository update");
  if (confirmWord !== "PUSH") {
    pushTerminal("push cancelled");
    return;
  }
  const { owner, repo } = parsed;
  const branchInput = (branchOverride || remoteBranch || "").trim();
  pushTerminal(`pushing to ${owner}/${repo} ...`);
  try {
    const apiFetch = async (url: string, init?: RequestInit) =>
      fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          ...(init?.headers ?? {}),
        },
      });
    const repoMetaRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoMetaRes.ok) {
      pushTerminal(`repo access failed: ${repoMetaRes.status}`);
      return;
    }
    const repoMeta = (await repoMetaRes.json()) as { default_branch?: string };
    const defaultBranch = repoMeta.default_branch || "main";
    const targetBranch = branchInput || defaultBranch;
    if (targetBranch === defaultBranch) {
      const confirmMain = window.prompt(`You are pushing to ${defaultBranch}. Type MAIN to confirm.`);
      if (confirmMain !== "MAIN") {
        pushTerminal("push cancelled (main not confirmed)");
        return;
      }
    }
    let branchRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`);
    if (branchRes.status === 404) {
      const defaultRefRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`);
      if (!defaultRefRes.ok) {
        pushTerminal(`cannot read default branch ref: ${defaultRefRes.status}`);
        return;
      }
      const defaultRef = (await defaultRefRes.json()) as { object?: { sha?: string } };
      const baseSha = defaultRef.object?.sha;
      if (!baseSha) {
        pushTerminal("cannot resolve base SHA");
        return;
      }
      const createBranchRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha: baseSha }),
      });
      if (!createBranchRes.ok) {
        pushTerminal(`branch create failed: ${createBranchRes.status}`);
        return;
      }
      branchRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`);
    }
    if (!branchRes.ok) {
      pushTerminal(`branch read failed: ${branchRes.status}`);
      return;
    }
    const entries = Object.entries(files);
    let success = 0;
    for (const [path, content] of entries) {
      const encodedPath = encodePathForGithub(path);
      const getRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(targetBranch)}`);
      let sha: string | undefined;
      if (getRes.ok) {
        const current = (await getRes.json()) as { sha?: string };
        sha = current.sha;
      }
      const putBody: { message: string; content: string; branch: string; sha?: string } = {
        message: `Studio sync: ${path}`,
        content: toBase64Utf8(content),
        branch: targetBranch,
      };
      if (sha) putBody.sha = sha;
      const putRes = await apiFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`, {
        method: "PUT",
        body: JSON.stringify(putBody),
      });
      if (putRes.ok) success += 1;
      else pushTerminal(`failed: ${path} (${putRes.status})`);
    }
    pushTerminal(`push complete: ${success}/${entries.length} files`);
  } catch {
    pushTerminal("github push failed");
  }
}
