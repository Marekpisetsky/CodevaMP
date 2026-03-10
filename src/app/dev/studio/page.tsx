
"use client";

import Link from "next/link";
import { Suspense, type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { devSupabase as supabase } from "@/app/lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import {
  STUDIO_BRIDGE_SETTINGS_LS_KEY,
  STUDIO_MODE_LS_KEY,
  STUDIO_ONBOARD_DONE_LS_KEY,
  STUDIO_REMOTE_MAX_COMMIT_BYTES,
  STUDIO_REMOTE_RETENTION,
  STUDIO_TEMPLATES,
  STACK_OPTIONS,
  compareCommits,
  buildFileTree,
  buildInitialHistories,
  encodePathForGithub,
  estimateWorkspaceBytes,
  formatProjectTitleFromId,
  getBridgeCandidates,
  hasExtension,
  isValidStack,
  normalizeDependency,
  normalizePath,
  parentFolders,
  parseGithubRepoUrl,
  readLocalRemoteCommits,
  readWorkspace,
  toBase64Utf8,
  toPreviewDocument,
  writeLocalRemoteCommits,
  writeWorkspace,
  type CodeHistoryState,
  type ConsoleEntry,
  type FileTreeNode,
  type StackKey,
  type StudioRemoteCommit,
  type UndoSnapshot,
} from "./studio-core";

export default function DevStudioPage() {
  return (
    <Suspense fallback={<main className="dev-root dev-root--stable" data-brand="dev"><div className="dev-shell dev-studio-shell"><section className="dev-lab"><div className="dev-lab__head"><h2>Cargando...</h2></div></section></div></main>}>
      <DevStudioContent />
    </Suspense>
  );
}

function DevStudioContent() {
  const { language, setUiLanguage } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);
  const params = useSearchParams();
  const router = useRouter();
  const stackParam = params.get("stack");
  const hasSelectedWorkspace = isValidStack(stackParam);
  const stack: StackKey = hasSelectedWorkspace ? stackParam : "web";
  const template = STUDIO_TEMPLATES[stack];

  const [files, setFiles] = useState<Record<string, string>>(template.files);
  const [folderPaths, setFolderPaths] = useState<string[]>(template.folderPaths);
  const [activeFile, setActiveFile] = useState<string>(Object.keys(template.files)[0] ?? "");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [dependencyInput, setDependencyInput] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [codeHistories, setCodeHistories] = useState<CodeHistoryState>(buildInitialHistories(template.files));
  const [previewDoc, setPreviewDoc] = useState<string>(toPreviewDocument(template.files, []));
  const [livePreview, setLivePreview] = useState(true);
  const [previewFocus, setPreviewFocus] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([tx("Studio listo.", "Studio is ready.")]);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [dragFilePath, setDragFilePath] = useState<string | null>(null);
  const [shellInput, setShellInput] = useState("");
  const [remoteRepoUrl, setRemoteRepoUrl] = useState("");
  const [remoteBranch, setRemoteBranch] = useState("main");
  const [remoteProjectId, setRemoteProjectId] = useState(`dev-${stack}`);
  const [remoteWorkspaceBranch, setRemoteWorkspaceBranch] = useState("main");
  const [remoteNewBranch, setRemoteNewBranch] = useState("");
  const [remoteCommitMessage, setRemoteCommitMessage] = useState("");
  const [remoteCommits, setRemoteCommits] = useState<StudioRemoteCommit[]>([]);
  const [remoteMainHead, setRemoteMainHead] = useState<StudioRemoteCommit | null>(null);
  const [remoteMergeBusy, setRemoteMergeBusy] = useState(false);
  const [remotePublishBusy, setRemotePublishBusy] = useState(false);
  const [remotePublishNote, setRemotePublishNote] = useState<string | null>(null);
  const [showGitSyncPanel, setShowGitSyncPanel] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null | undefined>(undefined);
  const [remoteStatus, setRemoteStatus] = useState<"cloud" | "local">("local");
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState("");
  const [repoVerified, setRepoVerified] = useState(false);
  const [repoOwnerMatch, setRepoOwnerMatch] = useState(false);
  const [repoVerificationNote, setRepoVerificationNote] = useState(tx("Pega la URL del repositorio y haz pull. Verifica ownership solo antes de push.", "Paste the repository URL and pull. Verify ownership only before push."));
  const [verifiedRepoUrl, setVerifiedRepoUrl] = useState("");
  const [autosavePulse, setAutosavePulse] = useState(false);
  const [studioMode, setStudioMode] = useState<"basic" | "pro">("basic");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const folderUploadInputRef = useRef<HTMLInputElement | null>(null);
  const previewWindowRef = useRef<Window | null>(null);
  const lastValidationErrorRef = useRef<string>("");
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [dragImportActive, setDragImportActive] = useState(false);
  const [localBridgeUrl, setLocalBridgeUrl] = useState("http://127.0.0.1:4173");
  const [localBridgeToken, setLocalBridgeToken] = useState("");
  const [localBridgeConnected, setLocalBridgeConnected] = useState(false);
  const [localBridgeBusy, setLocalBridgeBusy] = useState(false);
  const [localBridgeResolvedUrl, setLocalBridgeResolvedUrl] = useState("");
  const [showBridgeAdvanced, setShowBridgeAdvanced] = useState(false);

  const fileNames = useMemo(() => Object.keys(files), [files]);
  const fileTree = useMemo(() => buildFileTree(fileNames, folderPaths), [fileNames, folderPaths]);
  const hasValidRepoUrl = useMemo(() => Boolean(parseGithubRepoUrl(remoteRepoUrl)), [remoteRepoUrl]);
  const remoteDiffSummary = useMemo(() => {
    if (remoteWorkspaceBranch === "main") return null;
    return compareCommits(remoteMainHead ?? undefined, remoteCommits[0]);
  }, [remoteWorkspaceBranch, remoteMainHead, remoteCommits]);

  const pushTerminal = (text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setTerminalLines((prev) => [...prev, `[${time}] ${text}`].slice(-150));
  };
  const pushUndo = (label: string, nextFiles: Record<string, string>, nextFolders: string[], nextActive: string, nextDeps: string[]) => {
    setUndoStack((prev) => [...prev.slice(-30), { label, files: { ...nextFiles }, folderPaths: [...nextFolders], activeFile: nextActive, dependencies: [...nextDeps] }]);
  };

  const persistWorkspace = useCallback(() => {
    writeWorkspace(stack, { files, folderPaths, activeFile, dependencies });
  }, [stack, files, folderPaths, activeFile, dependencies]);

  const undoStructure = () => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const snapshot = prev[prev.length - 1];
      setFiles(snapshot.files);
      setFolderPaths(snapshot.folderPaths);
      setActiveFile(snapshot.activeFile);
      setDependencies(snapshot.dependencies);
      setCodeHistories(buildInitialHistories(snapshot.files));
      setPreviewDoc(toPreviewDocument(snapshot.files, snapshot.dependencies));
      pushTerminal(`undo structure: ${snapshot.label}`);
      return prev.slice(0, -1);
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = window.localStorage.getItem(STUDIO_MODE_LS_KEY);
    if (storedMode === "basic" || storedMode === "pro") setStudioMode(storedMode);
    const done = window.localStorage.getItem(STUDIO_ONBOARD_DONE_LS_KEY) === "1";
    setOnboardingDone(done);
    setShowOnboarding(!done);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STUDIO_MODE_LS_KEY, studioMode);
  }, [studioMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STUDIO_BRIDGE_SETTINGS_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { url?: string; token?: string };
      if (parsed.url) setLocalBridgeUrl(parsed.url);
      if (parsed.token) setLocalBridgeToken(parsed.token);
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STUDIO_BRIDGE_SETTINGS_LS_KEY,
        JSON.stringify({
          url: localBridgeUrl,
          token: localBridgeToken,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [localBridgeUrl, localBridgeToken]);

  useEffect(() => {
    setLocalBridgeConnected(false);
    setLocalBridgeResolvedUrl("");
  }, [localBridgeUrl, localBridgeToken]);

  const loadCodevampRemoteCommits = useCallback(
    async (projectIdValue?: string, branchValue?: string) => {
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
        const mapped = data.map((row) => ({
          id: row.id as string,
          message: (row.message as string) || "Checkpoint",
          createdAt: (row.created_at as string) || new Date().toISOString(),
          stack: ((row.stack as StackKey) || stack),
          branch: (row.branch as string) || branch,
          files: (row.files as Record<string, string>) || {},
          folderPaths: (row.folder_paths as string[]) || [],
          activeFile: (row.active_file as string) || "",
          dependencies: (row.dependencies as string[]) || [],
        })) as StudioRemoteCommit[];
        setRemoteStatus("cloud");
        setRemoteCommits(mapped);

        if (branch === "main") {
          setRemoteMainHead(mapped[0] ?? null);
        } else {
          const { data: mainData } = await supabase
            .from("dev_studio_commits")
            .select("id,project_id,branch,stack,message,files,folder_paths,active_file,dependencies,created_at")
            .eq("user_id", sessionUserId)
            .eq("project_id", projectId)
            .eq("branch", "main")
            .order("created_at", { ascending: false })
            .limit(1);
          if (mainData?.[0]) {
            const row = mainData[0];
            setRemoteMainHead({
              id: row.id as string,
              message: (row.message as string) || "Checkpoint",
              createdAt: (row.created_at as string) || new Date().toISOString(),
              stack: ((row.stack as StackKey) || stack),
              branch: (row.branch as string) || "main",
              files: (row.files as Record<string, string>) || {},
              folderPaths: (row.folder_paths as string[]) || [],
              activeFile: (row.active_file as string) || "",
              dependencies: (row.dependencies as string[]) || [],
            });
          } else {
            setRemoteMainHead(null);
          }
        }
      } catch {
        setRemoteStatus("local");
        const localBranchCommits = readLocalRemoteCommits(projectId, branch);
        setRemoteCommits(localBranchCommits);
        setRemoteMainHead(branch === "main" ? (localBranchCommits[0] ?? null) : (readLocalRemoteCommits(projectId, "main")[0] ?? null));
      }
    },
    [remoteProjectId, remoteWorkspaceBranch, stack, sessionUserId]
  );

  useEffect(() => {
    if (!supabase) {
      setSessionUserId(null);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSessionUserId(data.user?.id ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const defaultProjectId = `dev-${stack}`;
    setRemoteProjectId(defaultProjectId);
    setRemoteWorkspaceBranch("main");
    void loadCodevampRemoteCommits(defaultProjectId, "main");
  }, [stack, loadCodevampRemoteCommits]);

  useEffect(() => {
    void loadCodevampRemoteCommits(remoteProjectId, remoteWorkspaceBranch);
  }, [remoteProjectId, remoteWorkspaceBranch, stack, sessionUserId, loadCodevampRemoteCommits]);

  useEffect(() => {
    setRepoVerified(false);
    setRepoOwnerMatch(false);
    setVerifiedRepoUrl("");
    setRepoVerificationNote("Paste a repo URL and pull. Verify ownership only before push.");
  }, [remoteRepoUrl, remoteBranch]);

  useEffect(() => {
    const snap = readWorkspace(stack);
    if (!snap) return;
    setFiles(snap.files);
    setFolderPaths(snap.folderPaths);
    setActiveFile(snap.activeFile);
    setDependencies(snap.dependencies);
    setCodeHistories(buildInitialHistories(snap.files));
    setPreviewDoc(toPreviewDocument(snap.files, snap.dependencies));
    pushTerminal(`workspace loaded: ${template.label}`);
  }, [stack, template.label]);

  useEffect(() => {
    persistWorkspace();
    setAutosavePulse(true);
    const timer = window.setTimeout(() => setAutosavePulse(false), 450);
    return () => window.clearTimeout(timer);
  }, [persistWorkspace]);

  useEffect(() => {
    const persistNow = () => persistWorkspace();
    window.addEventListener("beforeunload", persistNow);
    window.addEventListener("pagehide", persistNow);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persistNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", persistNow);
      window.removeEventListener("pagehide", persistNow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [persistWorkspace]);

  useEffect(() => {
    if (!livePreview || stack !== "web") return;
    const timer = window.setTimeout(() => {
      const js = files["app.js"] ?? files["src/main.js"] ?? "";
      try {
        new Function(js);
        lastValidationErrorRef.current = "";
        setPreviewDoc(toPreviewDocument(files, dependencies));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown JS syntax error";
        if (lastValidationErrorRef.current !== message) {
          const entry: ConsoleEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            level: "error",
            message: `JS syntax error: ${message}`,
            location: activeFile,
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          };
          setConsoleEntries((prev) => [entry, ...prev].slice(0, 80));
          pushTerminal(`syntax error: ${message}`);
          lastValidationErrorRef.current = message;
        }
      }
    }, 120);
    return () => window.clearTimeout(timer);
  }, [livePreview, stack, files, dependencies, activeFile]);

  useEffect(() => {
    if (stack !== "web") return;
    const previewWindow = previewWindowRef.current;
    if (!previewWindow || previewWindow.closed) return;
    previewWindow.document.open();
    previewWindow.document.write(previewDoc);
    previewWindow.document.close();
  }, [previewDoc, stack]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; level?: "log" | "warn" | "error"; message?: string; location?: string };
      if (!data || data.source !== "dev-studio-preview" || !data.message) return;
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        level: data.level ?? "log",
        message: data.message,
        location: data.location,
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      };
      setConsoleEntries((prev) => [entry, ...prev].slice(0, 80));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLines]);

  const onChangeCode = (value: string) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    setCodeHistories((prev) => {
      const current = prev[activeFile] ?? { entries: [files[activeFile] ?? ""], index: 0 };
      if (current.entries[current.index] === value) return prev;
      const nextEntries = [...current.entries.slice(0, current.index + 1), value].slice(-250);
      return { ...prev, [activeFile]: { entries: nextEntries, index: nextEntries.length - 1 } };
    });
  };

  const undoCode = () => {
    const history = codeHistories[activeFile];
    if (!history || history.index <= 0) return;
    const nextIndex = history.index - 1;
    setCodeHistories((prev) => ({ ...prev, [activeFile]: { entries: history.entries, index: nextIndex } }));
    setFiles((prev) => ({ ...prev, [activeFile]: history.entries[nextIndex] ?? "" }));
  };

  const redoCode = () => {
    const history = codeHistories[activeFile];
    if (!history || history.index >= history.entries.length - 1) return;
    const nextIndex = history.index + 1;
    setCodeHistories((prev) => ({ ...prev, [activeFile]: { entries: history.entries, index: nextIndex } }));
    setFiles((prev) => ({ ...prev, [activeFile]: history.entries[nextIndex] ?? "" }));
  };

  const runProject = () => {
    if (stack === "web") {
      const js = files["app.js"] ?? files["src/main.js"] ?? "";
      try {
        new Function(js);
        lastValidationErrorRef.current = "";
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown JS syntax error";
        const entry: ConsoleEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          level: "error",
          message: `JS syntax error: ${message}`,
          location: activeFile,
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        };
        setConsoleEntries((prev) => [entry, ...prev].slice(0, 80));
        pushTerminal(`run blocked: ${message}`);
        return;
      }
      setPreviewDoc(toPreviewDocument(files, dependencies));
      pushTerminal("preview updated");
      return;
    }
    pushTerminal(`runtime required in external workspace (${template.label})`);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = event.ctrlKey || event.metaKey;
    if (!isMod) return;
    const key = event.key.toLowerCase();
    if (key === "s") {
      event.preventDefault();
      runProject();
      return;
    }
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      undoCode();
      return;
    }
    if ((key === "z" && event.shiftKey) || key === "y") {
      event.preventDefault();
      redoCode();
    }
  };

  const addDependency = () => {
    const dep = normalizeDependency(dependencyInput);
    if (!dep || dependencies.includes(dep)) return;
    setDependencies((prev) => [...prev, dep]);
    setDependencyInput("");
  };

  const removeDependency = (dep: string) => setDependencies((prev) => prev.filter((item) => item !== dep));

  const createEntryPrompt = () => {
    const raw = window.prompt("New entry name (example: src/utils/helper.ts or docs/)");
    if (!raw) return;
    let path = normalizePath(raw);
    if (!path) return;
    const wantsFolder = raw.trim().endsWith("/");
    if (wantsFolder) {
      if (!folderPaths.includes(path)) {
        pushUndo(`create folder ${path}`, files, folderPaths, activeFile, dependencies);
        setFolderPaths((prev) => Array.from(new Set([...prev, path])));
      }
      return;
    }
    if (!hasExtension(path)) path = `${path}.txt`;
    if (files[path] !== undefined) return;
    pushUndo(`create file ${path}`, files, folderPaths, activeFile, dependencies);
    setFiles((prev) => ({ ...prev, [path]: "" }));
    setFolderPaths((prev) => Array.from(new Set([...prev, ...parentFolders(path)])));
    setCodeHistories((prev) => ({ ...prev, [path]: { entries: [""], index: 0 } }));
    setActiveFile(path);
  };

  const deleteFile = (filePath: string) => {
    if (Object.keys(files).length <= 1) return;
    pushUndo(`delete ${filePath}`, files, folderPaths, activeFile, dependencies);
    const nextFiles = { ...files };
    delete nextFiles[filePath];
    setFiles(nextFiles);
    setCodeHistories((prev) => {
      const next = { ...prev };
      delete next[filePath];
      return next;
    });
    if (activeFile === filePath) setActiveFile(Object.keys(nextFiles)[0]);
  };

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => (prev.includes(folderPath) ? prev.filter((item) => item !== folderPath) : [...prev, folderPath]));
  };

  const moveFileToFolder = (sourceFile: string, targetFolder: string) => {
    if (!files[sourceFile]) return;
    const fileName = sourceFile.split("/").pop() ?? sourceFile;
    const targetPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;
    if (targetPath === sourceFile) return;
    pushUndo(`move ${sourceFile} -> ${targetPath}`, files, folderPaths, activeFile, dependencies);
    const moved = files[sourceFile];
    const nextFiles = { ...files };
    delete nextFiles[sourceFile];
    nextFiles[targetPath] = moved;
    setFiles(nextFiles);
    setFolderPaths((prev) => Array.from(new Set([...prev, ...parentFolders(targetPath), targetFolder].filter(Boolean) as string[])));
    if (activeFile === sourceFile) setActiveFile(targetPath);
  };

  const copyWorkspaceJson = async () => navigator.clipboard.writeText(JSON.stringify({ stack, files, folderPaths, dependencies }, null, 2));
  const openGithubDevFromRemote = () => {
    if (parseGithubRepoUrl(remoteRepoUrl)) {
      const match = remoteRepoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
      if (!match) {
        importFromGithub();
        return;
      }
      const owner = match[1];
      const repo = match[2].replace(/\.git$/i, "");
      window.open(`https://github.dev/${owner}/${repo}`, "_blank", "noopener,noreferrer");
      pushTerminal(`opened github.dev: ${owner}/${repo}`);
      return;
    }
    importFromGithub();
  };
  const openPreviewInNewTab = () => {
    if (stack !== "web") return;
    let previewWindow = previewWindowRef.current;
    if (!previewWindow || previewWindow.closed) {
      previewWindow = window.open("", "_blank", "noopener,noreferrer");
      previewWindowRef.current = previewWindow;
    }
    if (!previewWindow) return;
    previewWindow.document.open();
    previewWindow.document.write(previewDoc);
    previewWindow.document.close();
    previewWindow.focus();
  };

  const importFromGithub = () => {
    const repoUrl = window.prompt("GitHub repo URL (https://github.com/owner/repo)");
    if (!repoUrl) return;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (!match) {
      pushTerminal("invalid GitHub URL");
      return;
    }
    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, "");
    const githubDevUrl = `https://github.dev/${owner}/${repo}`;
    window.open(githubDevUrl, "_blank", "noopener,noreferrer");
    pushTerminal(`opened github.dev: ${owner}/${repo}`);
  };

  const ensureGithubToken = (reason: "verify" | "push") => {
    const current = githubTokenInput.trim();
    if (current) return current;
    const message = reason === "verify"
      ? "Paste your GitHub token to verify repository ownership before push."
      : "Paste your GitHub token to push changes.";
    const provided = window.prompt(message) ?? "";
    const token = provided.trim();
    if (!token) {
      pushTerminal("github token required");
      return "";
    }
    setGithubTokenInput(token);
    return token;
  };

  const verifyGithubRepo = async (repoUrl: string) => {
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

      const token = ensureGithubToken("verify");
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
  };

  const pullGithubRepoIntoWorkspace = async (repoUrl: string, branchOverride?: string) => {
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
        if (!contentType.includes("text") && !contentType.includes("json") && !contentType.includes("javascript") && !contentType.includes("xml")) {
          continue;
        }
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
  };

  const commitToCodevampRemote = async (messageOverride?: string) => {
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
      files: { ...files },
      folderPaths: [...folderPaths],
      activeFile,
      dependencies: [...dependencies],
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
  };

  const restoreCodevampCommit = async (commitId?: string) => {
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
  };

  const createOrSwitchRemoteBranch = async (branchOverride?: string) => {
    const projectId = normalizePath(remoteProjectId) || `dev-${stack}`;
    const nextBranch = normalizePath(branchOverride || remoteNewBranch || remoteWorkspaceBranch) || "main";
    setRemoteWorkspaceBranch(nextBranch);
    setRemoteNewBranch("");
    await loadCodevampRemoteCommits(projectId, nextBranch);
    pushTerminal(`CodevaMP branch active: ${projectId}@${nextBranch}`);
  };

  const mergeCurrentBranchIntoMain = async () => {
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
  };

  const publishCurrentWorkspaceToDev = async () => {
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
      const stackLabel = template.label;
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
            stack: stackLabel,
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
        router.push(`/dev?published=${encodeURIComponent(existing.id)}`);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("dev_projects")
        .insert({
          title,
          summary,
          stack: stackLabel,
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
      router.push(`/dev?published=${encodeURIComponent(inserted.id)}`);
    } finally {
      setRemotePublishBusy(false);
    }
  };

  const switchToMainBranch = async () => {
    setRemoteWorkspaceBranch("main");
    await loadCodevampRemoteCommits(remoteProjectId, "main");
  };

  const pushWorkspaceToGithub = async (repoUrl: string, branchOverride?: string) => {
    const parsed = parseGithubRepoUrl(repoUrl);
    if (!parsed) {
      pushTerminal("invalid GitHub URL");
      return;
    }
    if (!repoVerified || verifiedRepoUrl !== repoUrl.trim()) {
      pushTerminal("verify repo first");
      return;
    }
    const token = ensureGithubToken("push");
    if (!token) {
      return;
    }
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
      const apiFetch = async (url: string, init?: RequestInit) => {
        const response = await fetch(url, {
          ...init,
          headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          ...(init?.headers ?? {}),
        },
        });
        return response;
      };

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
        if (putRes.ok) {
          success += 1;
        } else {
          pushTerminal(`failed: ${path} (${putRes.status})`);
        }
      }
      pushTerminal(`push complete: ${success}/${entries.length} files`);
    } catch {
      pushTerminal("github push failed");
    }
  };

  const importFileList = useCallback(async (selected: File[]) => {
    if (!selected.length) return;
    const nextFiles = { ...files };
    const nextFolders = new Set(folderPaths);
    for (const file of selected) {
      const rawPath = normalizePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name);
      if (!rawPath) continue;
      const path = hasExtension(rawPath) ? rawPath : `${rawPath}.txt`;
      try {
        const content = await file.text();
        nextFiles[path] = content;
        parentFolders(path).forEach((folder) => nextFolders.add(folder));
      } catch {
        pushTerminal(`failed to read: ${path}`);
      }
    }
    pushUndo("import files", files, folderPaths, activeFile, dependencies);
    setFiles(nextFiles);
    setFolderPaths(Array.from(nextFolders));
    setCodeHistories(buildInitialHistories(nextFiles));
    setActiveFile(Object.keys(nextFiles)[0] ?? activeFile);
    pushTerminal(`${selected.length} files imported`);
  }, [files, folderPaths, activeFile, dependencies]);

  const onUploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files;
    if (!inputFiles?.length) return;
    await importFileList(Array.from(inputFiles));
    event.target.value = "";
  };

  const exportWorkspaceZip = async () => {
    try {
      const mod = await import("jszip");
      const JSZip = mod.default;
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });
      if (dependencies.length) {
        zip.file(
          "workspace.dependencies.txt",
          dependencies.join("\n")
        );
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      link.href = URL.createObjectURL(blob);
      link.download = `codevamp-${stack}-workspace-${stamp}.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 30_000);
      pushTerminal("workspace zip exported");
    } catch {
      pushTerminal("zip export failed");
    }
  };

  const renderTree = (nodes: FileTreeNode[], depth = 0) => nodes.map((node) => {
    if (node.type === "folder") {
      const collapsed = collapsedFolders.includes(node.path);
      return (
        <div key={node.path} className="dev-tree-node" style={{ marginLeft: `${depth * 10}px` }}>
          <button type="button" className="dev-folder" onClick={() => toggleFolder(node.path)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData("text/plain"); if (source) moveFileToFolder(source, node.path); }}>
            <span className="dev-folder__chevron" aria-hidden>{collapsed ? "+" : "-"}</span><span>{node.name}</span>
          </button>
          {!collapsed && node.children?.length ? renderTree(node.children, depth + 1) : null}
        </div>
      );
    }
    return (
      <div key={node.path} className="dev-file-row" style={{ marginLeft: `${depth * 10}px` }}>
        <button type="button" className={node.path === activeFile ? "is-active" : ""} onClick={() => setActiveFile(node.path)} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", node.path); setDragFilePath(node.path); }} onDragEnd={() => setDragFilePath(null)}>{node.name}</button>
        <button type="button" className="dev-file-delete" onClick={() => deleteFile(node.path)} disabled={fileNames.length <= 1} aria-label={`${tx("Eliminar", "Delete")} ${node.name}`} title={`${tx("Eliminar", "Delete")} ${node.name}`}>x</button>
      </div>
    );
  });

  const runShellCommand = () => {
    const raw = shellInput.trim();
    if (!raw) return;
    pushTerminal(`$ ${raw}`);
    const cleanRaw = raw.replace(/^\$\s*/, "");
    const explicitLocal = cleanRaw.startsWith("!");
    const localCmd = explicitLocal ? cleanRaw.slice(1).trim() : cleanRaw;

    const runLocalCommand = (cmdValue: string) => {
      if (!cmdValue) {
        pushTerminal("local shell: empty command");
        return;
      }
      if (!localBridgeConnected) {
        pushTerminal("local shell not connected. Use Connect local shell first.");
        return;
      }
      void (async () => {
        try {
          const bridgeBase = (localBridgeResolvedUrl || localBridgeUrl).replace(/\/$/, "");
          const response = await fetch("/api/dev/bridge", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              action: "exec",
              target: bridgeBase,
              token: localBridgeToken,
              cmd: cmdValue,
            }),
          });
          const payload = (await response.json()) as {
            ok?: boolean;
            status?: number;
            data?: { stdout?: string; stderr?: string; code?: number; error?: string };
            error?: string;
          };
          const data = payload.data;
          if (!response.ok || payload.ok === false || !data || data.error) {
            const errorText = payload.error || data?.error || `http ${payload.status || response.status}`;
            if (/stdin is not a terminal/i.test(errorText)) {
              pushTerminal("local shell: ese comando necesita una terminal interactiva (TTY).");
              pushTerminal("ejecutalo en tu terminal local real o usa una variante no interactiva (ej: codex --help).");
            } else {
              pushTerminal(`local shell error: ${errorText}`);
            }
            return;
          }
          if (data.stdout) {
            data.stdout.split(/\r?\n/).filter(Boolean).forEach((line) => pushTerminal(`[local] ${line}`));
          }
          if (data.stderr) {
            data.stderr.split(/\r?\n/).filter(Boolean).forEach((line) => pushTerminal(`[local:err] ${line}`));
          }
          pushTerminal(`local shell exit code ${data.code ?? 0}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : "failed";
          setLocalBridgeConnected(false);
          setLocalBridgeResolvedUrl("");
          pushTerminal(`local shell unreachable: ${message}`);
        }
      })();
    };

    if (explicitLocal) {
      runLocalCommand(localCmd);
      setShellInput("");
      return;
    }

    const [cmd, ...args] = cleanRaw.split(/\s+/);
    const rest = args.join(" ").trim();
    if (cmd === "help") {
      pushTerminal("commands: help, ls, tree, pwd, open <file>, deps, install <pkg>, github <url>, verify github <url>, pull github <url> [branch], push github <url> [branch], clear");
      pushTerminal("tip: with local shell connected, unknown commands run locally (you can still force with !cmd).");
      pushTerminal('codevamp: branch <name>, commit <message>, history, pull, checkout <commit-id>, diff main, merge main');
    } else if (cmd === "ls") {
      pushTerminal(fileNames.join("  "));
    } else if (cmd === "tree") {
      const lines = fileTree
        .flatMap((node) => {
          if (node.type === "file") return [node.path];
          const children = node.children?.map((child) => `  ${child.path}`) ?? [];
          return [node.path + "/", ...children];
        })
        .slice(0, 24);
      lines.forEach((line) => pushTerminal(line));
    } else if (cmd === "pwd") {
      pushTerminal(`/dev/studio?stack=${stack}`);
    } else if (cmd === "open" && rest) {
      if (!files[rest]) {
        pushTerminal(`file not found: ${rest}`);
      } else {
        setActiveFile(rest);
        pushTerminal(`opened: ${rest}`);
      }
    } else if (cmd === "deps") {
      pushTerminal(dependencies.length ? dependencies.join(", ") : "no deps");
    } else if (cmd === "install" && rest) {
      const dep = normalizeDependency(rest);
      if (dep && !dependencies.includes(dep)) {
        setDependencies((prev) => [...prev, dep]);
        pushTerminal(`dependency added: ${dep}`);
      } else {
        pushTerminal("dependency already exists or invalid");
      }
    } else if (cmd === "commit") {
      void commitToCodevampRemote(rest);
    } else if (cmd === "branch" && args[0]) {
      void createOrSwitchRemoteBranch(args[0]);
    } else if (cmd === "history") {
      if (!remoteCommits.length) {
        pushTerminal("no commits yet");
      } else {
        remoteCommits.slice(0, 8).forEach((row) => {
          pushTerminal(`${row.id}  [${row.branch}] ${row.message}`);
        });
      }
    } else if (cmd === "pull" && args.length === 0) {
      void restoreCodevampCommit();
    } else if (cmd === "checkout" && args[0]) {
      void restoreCodevampCommit(args[0]);
    } else if (cmd === "diff" && args[0] === "main") {
      if (!remoteDiffSummary) {
        pushTerminal("diff unavailable (use a non-main branch with commits)");
      } else {
        pushTerminal(`diff vs main -> +${remoteDiffSummary.added} ~${remoteDiffSummary.changed} -${remoteDiffSummary.removed}${remoteDiffSummary.dependencyChanged ? " deps changed" : ""}`);
      }
    } else if (cmd === "merge" && args[0] === "main") {
      void mergeCurrentBranchIntoMain();
    } else if (cmd === "github" && rest) {
      const match = rest.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
      if (!match) {
        pushTerminal("invalid GitHub URL");
      } else {
        const owner = match[1];
        const repo = match[2].replace(/\.git$/i, "");
        const githubDevUrl = `https://github.dev/${owner}/${repo}`;
        window.open(githubDevUrl, "_blank", "noopener,noreferrer");
        pushTerminal(`opened github.dev: ${owner}/${repo}`);
      }
    } else if (cmd === "pull" && args[0] === "github" && args[1]) {
      void pullGithubRepoIntoWorkspace(args[1], args[2]);
    } else if (cmd === "push" && args[0] === "github" && args[1]) {
      void pushWorkspaceToGithub(args[1], args[2]);
    } else if (cmd === "verify" && args[0] === "github" && args[1]) {
      void verifyGithubRepo(args[1]);
    } else if (cmd === "clear") {
      setTerminalLines([]);
    } else {
      if (localBridgeConnected) {
        runLocalCommand(cleanRaw);
      } else {
        pushTerminal(`unknown command: ${cmd} (run "help")`);
      }
    }
    setShellInput("");
  };

  const copyBridgeCommand = async () => {
    const command = `powershell -ExecutionPolicy Bypass -File "C:\\Users\\Marek\\OneDrive\\Documentos\\CodevaMP\\scripts\\start-local-shell-bridge.ps1"`;
    try {
      await navigator.clipboard.writeText(command);
      pushTerminal("bridge command copied");
    } catch {
      pushTerminal("failed to copy bridge command");
    }
  };

  const connectLocalShell = async () => {
    setLocalBridgeBusy(true);
    try {
      const candidates = getBridgeCandidates(localBridgeUrl);
      if (!candidates.length) {
        setLocalBridgeConnected(false);
        setLocalBridgeResolvedUrl("");
        pushTerminal("local shell URL empty");
        return;
      }

      for (const candidate of candidates) {
        try {
          const response = await fetch("/api/dev/bridge", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              action: "health",
              target: candidate,
              token: localBridgeToken,
            }),
          });
          const payload = (await response.json()) as {
            ok?: boolean;
            status?: number;
            error?: string;
          };
          if (!response.ok || payload.ok === false) {
            if (payload.status === 401) {
              setLocalBridgeConnected(false);
              setLocalBridgeResolvedUrl("");
              pushTerminal("local shell token rejected (401). Update token or clear token.");
              return;
            }
            if (payload.error) {
              pushTerminal(`bridge probe failed on ${candidate}: ${payload.error}`);
            }
            continue;
          }
          setLocalBridgeConnected(true);
          setLocalBridgeResolvedUrl(candidate);
          pushTerminal(`local shell connected: ${candidate}`);
          return;
        } catch {
          // try next candidate
        }
      }

      setLocalBridgeConnected(false);
      setLocalBridgeResolvedUrl("");
      pushTerminal(`local shell unreachable. Tried: ${candidates.join(" | ")}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed";
      setLocalBridgeConnected(false);
      setLocalBridgeResolvedUrl("");
      pushTerminal(`local shell unreachable: ${message}`);
    } finally {
      setLocalBridgeBusy(false);
    }
  };

  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types?.includes("Files")) return;
      event.preventDefault();
      setDragImportActive(true);
    };
    const onDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) setDragImportActive(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!event.dataTransfer?.files?.length) {
        setDragImportActive(false);
        return;
      }
      event.preventDefault();
      setDragImportActive(false);
      void importFileList(Array.from(event.dataTransfer.files));
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [importFileList]);

  const onboardingItems = isEs
    ? [
        "1) Crea o sube archivos desde Explorer.",
        "2) Edita codigo y valida en el preview en vivo.",
        "3) Usa Pull con URL para traer repos publicos.",
        "4) Verifica ownership solo antes de hacer Push.",
      ]
    : [
        "1) Create or upload files from Explorer.",
        "2) Edit code and validate in live preview.",
        "3) Use Pull with URL to bring public repos.",
        "4) Verify ownership only before Push.",
      ];

  const stackDescById: Record<StackKey, string> = {
    web: tx("HTML/CSS/JS con preview en vivo", "HTML/CSS/JS with live preview"),
    react: tx("Starter de componentes con TS", "Components starter with TS"),
    next: tx("Estructura con App Router", "App router structure"),
    node: tx("Workspace orientado a servidor", "Server-first workspace"),
    python: tx("Base para scripts y modulos", "Script and module base"),
  };
  const studioAuthHref = `/auth?returnTo=/dev/studio?stack=${encodeURIComponent(stack)}`;

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingDone(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STUDIO_ONBOARD_DONE_LS_KEY, "1");
    }
  };

  return (
    <main className="dev-root dev-root--stable" data-brand="dev">
      <div className="dev-shell dev-studio-shell">
        <header className="dev-topbar">
          <Link href="/dev" className="dev-brand" prefetch><span className="dev-brand__badge">DV</span><span className="dev-brand__text"><strong>{tx("Dev Studio", "Dev Studio")}</strong><span>{template.label}</span></span></Link>
          <nav className="dev-nav"><Link href="/dev" prefetch>{tx("Volver a Dev", "Back to Dev")}</Link></nav>
          <div className="studio-mode-switch" role="group" aria-label={tx("Modo Studio", "Studio mode")}>
            <button type="button" className={studioMode === "basic" ? "is-active" : ""} onClick={() => setStudioMode("basic")}>{tx("Basico", "Basic")}</button>
            <button type="button" className={studioMode === "pro" ? "is-active" : ""} onClick={() => setStudioMode("pro")}>Pro</button>
          </div>
          <div className="studio-topbar-meta">
            <span className="studio-token-state">{tx("Autosave local activo", "Local autosave active")}</span>
            {!sessionUserId ? (
              <Link href={studioAuthHref} className="dev-topbar__cta dev-topbar__cta--ghost" prefetch>
                {tx("Iniciar sesion", "Sign in")}
              </Link>
            ) : null}
            <button type="button" className="dev-topbar__cta" onClick={openGithubDevFromRemote}>{tx("Abrir en github.dev", "Open in github.dev")}</button>
            <button type="button" className="dev-topbar__cta" onClick={() => setUiLanguage(language === "es" ? "en" : "es")}>{language.toUpperCase()}</button>
          </div>
        </header>

        {!hasSelectedWorkspace ? (
          <section className="dev-lab" aria-label={tx("Elegir espacio de trabajo", "Choose workspace")}>
            <div className="dev-lab__head dev-studio-head">
              <div>
                <h2>{tx("Selecciona un espacio de trabajo antes de entrar al studio", "Select a workspace before entering Studio")}</h2>
                <p>{tx("Elige un stack para evitar reemplazos accidentales de archivos.", "Pick one stack to avoid accidental file replacement.")}</p>
              </div>
              <span className="dev-status dev-status--building">{tx("Inicio seguro requerido", "Safe start required")}</span>
            </div>
            <div className="studio-gate-grid">
              {STACK_OPTIONS.map((option) => (
                <Link key={option.id} href={`/dev/studio?stack=${option.id}`} className="studio-gate-card">
                  <strong>{option.label}</strong>
                  <span>{stackDescById[option.id]}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
        <section className="dev-lab" aria-label={tx("Espacio de trabajo del studio", "Studio workspace")}>
          <div className="dev-lab__head dev-studio-head"><div><h2>{tx("Nucleo seguro del workspace", "Secure workspace core")}</h2>{studioMode === "basic" ? <p>{tx("Autosave activo y preview local seguro.", "Autosave active and safe local preview.")}</p> : null}</div><span className="dev-status dev-status--building">{tx("Workspace", "Workspace")}: {template.label}</span></div>

          {studioMode === "basic" && showOnboarding ? (
            <div className="studio-onboarding">
              <strong>{tx("Primeros pasos", "Quick start")}</strong>
              <p>{onboardingItems[onboardingStep]}</p>
              <div className="studio-onboarding-actions">
                <button type="button" onClick={() => setOnboardingStep((prev) => Math.max(0, prev - 1))} disabled={onboardingStep === 0}>{tx("Anterior", "Previous")}</button>
                {onboardingStep < onboardingItems.length - 1 ? (
                  <button type="button" onClick={() => setOnboardingStep((prev) => Math.min(onboardingItems.length - 1, prev + 1))}>{tx("Siguiente", "Next")}</button>
                ) : (
                  <button type="button" onClick={completeOnboarding}>{tx("Entendido", "Got it")}</button>
                )}
              </div>
            </div>
          ) : null}

          <div className="studio-actions">
            <div className="studio-actions__primary">
              <Link href="/dev" prefetch className="studio-action-link">{tx("Publicar proyecto", "Publish project")}</Link>
              <button type="button" onClick={() => setShowAdvancedTools((prev) => !prev)}>{showAdvancedTools ? tx("Ocultar avanzado", "Hide advanced") : tx("Herramientas avanzadas", "Advanced tools")}</button>
            </div>
            <div className="studio-actions__secondary">
              {studioMode === "basic" ? (
                <button
                  type="button"
                  onClick={() => setShowOnboarding((prev) => !prev)}
                >
                  {showOnboarding ? tx("Ocultar guia", "Hide guide") : onboardingDone ? tx("Ver guia", "View guide") : tx("Mostrar guia", "Show guide")}
                </button>
              ) : null}
              <span className={`studio-autosave${autosavePulse ? " is-pulse" : ""}`}>{tx("Autosave ON", "Autosave ON")}</span>
            </div>
            <input ref={uploadInputRef} type="file" multiple style={{ display: "none" }} onChange={onUploadFiles} />
            <input
              ref={(element) => {
                folderUploadInputRef.current = element;
                if (element) {
                  element.setAttribute("webkitdirectory", "");
                  element.setAttribute("directory", "");
                }
              }}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={onUploadFiles}
            />
          </div>

          {showAdvancedTools ? (
            <div className="studio-advanced">
              <button type="button" onClick={undoStructure} disabled={!undoStack.length}>{tx("Deshacer estructura", "Undo structure")}</button>
              <button type="button" onClick={copyWorkspaceJson}>{tx("Copiar JSON del workspace", "Copy workspace JSON")}</button>
              <button type="button" onClick={importFromGithub}>{tx("Abrir github.dev", "Open github.dev")}</button>
              <button type="button" onClick={() => uploadInputRef.current?.click()}>{tx("Importar archivos", "Import files")}</button>
              <button type="button" onClick={() => folderUploadInputRef.current?.click()}>{tx("Importar carpeta", "Import folder")}</button>
              <button type="button" onClick={exportWorkspaceZip}>{tx("Exportar ZIP", "Export ZIP")}</button>
              <button type="button" onClick={() => setLivePreview((prev) => !prev)}>{livePreview ? tx("Preview en vivo ON", "Live preview ON") : tx("Preview en vivo OFF", "Live preview OFF")}</button>
              <button type="button" onClick={() => setPreviewFocus((prev) => !prev)}>{previewFocus ? tx("Mostrar editor", "Show editor") : tx("Enfocar preview", "Focus preview")}</button>
              <span className={`studio-autosave${autosavePulse ? " is-pulse" : ""}`}>{tx("Autosave ON", "Autosave ON")}</span>
            </div>
          ) : null}

          <div className={`studio-grid${previewFocus ? " is-preview-focus" : ""}`}>
            <aside className="dev-card studio-pane">
              <div className="dev-card__head"><h2 className="studio-heading">{tx("Explorer", "Explorer")}</h2><button type="button" className="dev-action-secondary" onClick={createEntryPrompt}>{tx("Nuevo", "New")}</button></div>
              <div className={`dev-drop-root${dragFilePath ? " is-active" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData("text/plain"); if (source) moveFileToFolder(source, ""); }}>{tx("Suelta aqui para mover archivo a la raiz", "Drop here to move file to root")}</div>
              <div className="dev-tree">{renderTree(fileTree)}</div>
            </aside>

            <section className="dev-card studio-pane studio-editor-pane">
              <div className="dev-card__head"><h2 className="studio-heading">{activeFile}</h2><span className="dev-status dev-status--building">{tx("editando", "editing")}</span></div>
              {studioMode === "basic" ? <p className="studio-hint">{tx("Atajos: Ctrl+S guardar, Ctrl+Z deshacer, Ctrl+Y rehacer.", "Shortcuts: Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo.")}</p> : null}
              <textarea value={files[activeFile] ?? ""} onChange={(event) => onChangeCode(event.target.value)} onKeyDown={handleEditorKeyDown} spellCheck={false} className="studio-editor" />
            </section>

            <section className="dev-card studio-pane studio-right">
              <div className="dev-card__head">
                <h2 className="studio-heading">{tx("Preview + Consola", "Preview + Console")}</h2>
                {stack === "web" ? <button type="button" className="dev-action-secondary" onClick={openPreviewInNewTab}>{tx("Abrir vista en vivo", "Open live view")}</button> : null}
              </div>
              {stack === "web" ? (
                <button type="button" className="studio-preview-wrap" onClick={() => setPreviewFocus((prev) => !prev)}><iframe title={tx("Vista previa web", "Web preview")} srcDoc={previewDoc} sandbox="allow-scripts" referrerPolicy="no-referrer" className="studio-preview" /></button>
              ) : (
                <div className="dev-card__preview-empty studio-placeholder"><span>{tx("Runtime en workspace externo", "Runtime in external workspace")}</span><p>{template.notes}</p></div>
              )}

              <details className="studio-panel" open={studioMode === "basic"}>
                <summary>{tx("Dependencias", "Dependencies")}</summary>
                <div className="studio-deps">
                  <div className="studio-deps-row"><input id="deps-input" type="text" value={dependencyInput} placeholder="zod, axios, lodash" onChange={(event) => setDependencyInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDependency(); } }} /><button type="button" onClick={addDependency}>{tx("Agregar", "Add")}</button></div>
                  <div className="dev-card__meta">{dependencies.length ? dependencies.map((dep) => <span key={dep}>{dep}<button type="button" onClick={() => removeDependency(dep)}>x</button></span>) : <span>{tx("Sin dependencias", "No dependencies")}</span>}</div>
                </div>
              </details>

              <details className="studio-panel" open={showAdvancedTools}>
                <summary>{tx("Remoto CodevaMP", "CodevaMP Remote")}</summary>
                <div className="studio-shell">
                  <div className="studio-remote-meta">
                    <span className="studio-token-state">Proyecto: {normalizePath(remoteProjectId) || `dev-${stack}`}</span>
                    <span className="studio-token-state">Branch: {normalizePath(remoteWorkspaceBranch) || "main"}</span>
                    <span className="studio-token-state">{tx("Estado", "Status")}: {remoteStatus === "cloud" ? "Cloud" : tx("Local", "Local")}</span>
                    <span className="studio-token-state">{tx("Commits", "Commits")}: {remoteCommits.length}</span>
                  </div>
                  <div className="studio-shell-row">
                    <input
                      type="text"
                      value={remoteProjectId}
                      placeholder={tx("project id (ej: hush-ops-strikebox)", "project id (e.g.: hush-ops-strikebox)")}
                      onChange={(event) => setRemoteProjectId(event.target.value)}
                    />
                    <button type="button" onClick={() => void loadCodevampRemoteCommits(remoteProjectId)}>{tx("Actualizar", "Refresh")}</button>
                  </div>
                  <div className="studio-shell-row">
                    <input
                      type="text"
                      value={remoteWorkspaceBranch}
                      placeholder={tx("branch (ej: main)", "branch (e.g.: main)")}
                      onChange={(event) => setRemoteWorkspaceBranch(event.target.value)}
                    />
                    <button type="button" onClick={() => void loadCodevampRemoteCommits(remoteProjectId, remoteWorkspaceBranch)}>{tx("Cargar branch", "Load branch")}</button>
                  </div>
                  <div className="studio-shell-row">
                    <input
                      type="text"
                      value={remoteNewBranch}
                      placeholder={tx("new branch (ej: experiment-ui)", "new branch (e.g.: experiment-ui)")}
                      onChange={(event) => setRemoteNewBranch(event.target.value)}
                    />
                    <button type="button" onClick={() => void createOrSwitchRemoteBranch()}>{tx("Crear/Cambiar", "Create/Switch")}</button>
                  </div>
                  <div className="studio-shell-row">
                    <input
                      type="text"
                      value={remoteCommitMessage}
                      placeholder={tx("Mensaje de commit", "Commit message")}
                      onChange={(event) => setRemoteCommitMessage(event.target.value)}
                    />
                    <button type="button" onClick={() => void commitToCodevampRemote()}>{tx("Commit", "Commit")}</button>
                  </div>
                  <div className="studio-shell-row">
                    <span className="studio-token-state">{tx("Publicar en /dev crea o actualiza una tarjeta del proyecto.", "Publishing to /dev creates or updates a project card.")}</span>
                    <button type="button" onClick={() => void publishCurrentWorkspaceToDev()} disabled={remotePublishBusy}>
                      {remotePublishBusy ? tx("Publicando...", "Publishing...") : tx("Publicar en /dev", "Publish to /dev")}
                    </button>
                  </div>
                  {!sessionUserId ? (
                    <div className="studio-shell-row">
                      <span className="studio-token-state">{tx("Necesitas sesion activa para publicar.", "You need an active session to publish.")}</span>
                      <Link href={studioAuthHref} className="dev-action-secondary" prefetch>
                        {tx("Abrir Auth", "Open Auth")}
                      </Link>
                    </div>
                  ) : null}
                  {remotePublishNote ? (
                    <div className="studio-shell-row">
                      <span className="studio-token-state">{remotePublishNote}</span>
                    </div>
                  ) : null}
                  <div className="studio-shell-row">
                    <span className="studio-token-state">{tx("Restaura commits del branch activo.", "Restore commits from the active branch.")}</span>
                    <button type="button" onClick={() => void restoreCodevampCommit()} disabled={!remoteCommits.length}>{tx("Traer ultimo", "Pull latest")}</button>
                  </div>
                  {remoteWorkspaceBranch !== "main" ? (
                    <div className="studio-shell-row">
                      <span className="studio-token-state">
                        {remoteDiffSummary
                          ? `Diff vs main: +${remoteDiffSummary.added} ~${remoteDiffSummary.changed} -${remoteDiffSummary.removed}${remoteDiffSummary.dependencyChanged ? tx(" (deps cambiadas)", " (deps changed)") : ""}`
                          : tx("Diff vs main no disponible", "Diff vs main unavailable")}
                      </span>
                      <button type="button" onClick={() => void switchToMainBranch()}>
                        {tx("Cambiar a main", "Switch to main")}
                      </button>
                      <button type="button" onClick={() => void mergeCurrentBranchIntoMain()} disabled={remoteMergeBusy || !remoteCommits.length}>
                        {remoteMergeBusy ? tx("Haciendo merge...", "Merging...") : "Merge -> main"}
                      </button>
                    </div>
                  ) : null}
                  <div className="studio-console-body" style={{ maxHeight: "160px" }}>
                    {remoteCommits.length ? remoteCommits.slice(0, 8).map((row) => (
                      <div key={row.id} className="studio-log studio-log--log">
                        <span className="studio-log-level">{row.id} [{row.branch}]</span>
                        <span className="studio-log-msg">{row.message}</span>
                        <span className="studio-log-time">{new Date(row.createdAt).toLocaleString("en-US", { hour12: false })}</span>
                        <div style={{ display: "inline-flex", gap: ".35rem" }}>
                          <button type="button" onClick={() => void restoreCodevampCommit(row.id)}>{tx("Restaurar", "Restore")}</button>
                        </div>
                      </div>
                    )) : <div className="studio-log-empty">{tx("Sin commits aun.", "No commits yet.")}</div>}
                  </div>
                </div>
                <div className="studio-shell-row" style={{ margin: ".5rem" }}>
                  <span className="studio-token-state">{tx("GitHub sync es opcional. El remoto principal es CodevaMP.", "GitHub sync is optional. CodevaMP is the main remote.")}</span>
                  <button type="button" onClick={() => setShowGitSyncPanel((prev) => !prev)}>
                    {showGitSyncPanel ? tx("Ocultar Git sync", "Hide Git sync") : tx("Mostrar Git sync", "Show Git sync")}
                  </button>
                </div>
                <details className="studio-panel" style={{ margin: ".5rem" }} open={showGitSyncPanel}>
                  <summary>{tx("Git sync (opcional)", "Git sync (optional)")}</summary>
                  <div className="studio-shell">
                    <div className="studio-token-state">{tx("Opcional: sincroniza con GitHub cuando quieras colaboracion externa.", "Optional: sync with GitHub when you want external collaboration.")}</div>
                    <div className="studio-shell-row">
                      <input
                        type="text"
                        value={remoteRepoUrl}
                        placeholder="https://github.com/owner/repo"
                        onChange={(event) => setRemoteRepoUrl(event.target.value)}
                      />
                      <button type="button" onClick={() => void importFromGithub()}>{tx("Abrir github.dev", "Open github.dev")}</button>
                    </div>
                    <div className="studio-shell-row">
                      <input
                        type="text"
                        value={remoteBranch}
                        placeholder="main"
                        onChange={(event) => setRemoteBranch(event.target.value)}
                      />
                      <button type="button" onClick={() => void pullGithubRepoIntoWorkspace(remoteRepoUrl, remoteBranch)} disabled={!hasValidRepoUrl}>{tx("Pull", "Pull")}</button>
                    </div>
                    <div className="studio-shell-row">
                      <input
                        type="password"
                        value={githubTokenInput}
                        placeholder={tx("GitHub token (solo requerido para push)", "GitHub token (required only for push)")}
                        onChange={(event) => setGithubTokenInput(event.target.value)}
                      />
                      <button type="button" onClick={() => void verifyGithubRepo(remoteRepoUrl)} disabled={!hasValidRepoUrl}>{tx("Verificar ownership", "Verify ownership")}</button>
                    </div>
                    <div className="studio-shell-row">
                      <span className="studio-token-state">{repoVerificationNote}</span>
                      <div style={{ display: "inline-flex", gap: ".35rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => void pushWorkspaceToGithub(remoteRepoUrl, remoteBranch)} disabled={!repoVerified || !repoOwnerMatch}>{tx("Push", "Push")}</button>
                      </div>
                    </div>
                  </div>
                </details>
              </details>

              <details className="studio-panel" open>
                <summary>{tx("Consola", "Console")}</summary>
                <div className="studio-console">
                  <div className="studio-console-head"><strong>{tx("Logs de runtime", "Runtime logs")}</strong><button type="button" onClick={() => setConsoleEntries([])}>{tx("Limpiar", "Clear")}</button></div>
                  <div className="studio-console-body">{consoleEntries.length ? consoleEntries.map((entry) => <div key={entry.id} className={`studio-log studio-log--${entry.level}`}><span className="studio-log-level">{entry.level.toUpperCase()}</span><span className="studio-log-msg">{entry.message}</span>{entry.location ? <span className="studio-log-loc">{entry.location}</span> : null}<span className="studio-log-time">{entry.time}</span></div>) : <div className="studio-log-empty">{tx("Sin logs aun.", "No logs yet.")}</div>}</div>
                </div>
              </details>

              <details className="studio-panel" open>
                <summary>{tx("Shell", "Shell")}</summary>
                <div className="studio-shell">
                  <div className="studio-shell-row">
                    <button type="button" onClick={() => void copyBridgeCommand()}>{tx("Copiar comando inicial", "Copy start command")}</button>
                    <button type="button" onClick={() => void connectLocalShell()} disabled={localBridgeBusy}>
                      {localBridgeConnected ? tx("Shell local conectada", "Local shell connected") : localBridgeBusy ? tx("Conectando...", "Connecting...") : tx("Conectar shell local", "Connect local shell")}
                    </button>
                  </div>
                  <span className="studio-token-state">{tx("Paso 1: ejecuta el comando copiado en la carpeta de tu proyecto. Paso 2: conecta shell local.", "Step 1: run the copied command in your project folder. Step 2: connect local shell.")}</span>
                  <div className="studio-shell-row">
                    <button type="button" onClick={() => setShowBridgeAdvanced((prev) => !prev)}>
                      {showBridgeAdvanced ? tx("Ocultar ajustes avanzados", "Hide advanced settings") : tx("Mostrar ajustes avanzados", "Show advanced settings")}
                    </button>
                    <span className="studio-token-state">{localBridgeConnected ? tx("Conectada", "Connected") : tx("No conectada", "Not connected")}</span>
                  </div>
                  {showBridgeAdvanced ? (
                    <>
                      <div className="studio-shell-row">
                        <input
                          type="text"
                          value={localBridgeUrl}
                          placeholder="http://127.0.0.1:4173"
                          onChange={(event) => setLocalBridgeUrl(event.target.value)}
                        />
                        <span className="studio-token-state">Bridge URL</span>
                      </div>
                      <div className="studio-shell-row">
                        <input
                          type="password"
                          value={localBridgeToken}
                          placeholder={tx("Bridge token (opcional)", "Bridge token (optional)")}
                          onChange={(event) => setLocalBridgeToken(event.target.value)}
                        />
                        <span className="studio-token-state">{localBridgeToken ? tx("Token configurado", "Token set") : tx("Sin token", "No token")}</span>
                      </div>
                    </>
                  ) : null}
                  <span className="studio-token-state">{tx("Ejecuta comandos locales con prefijo ! (ejemplo: !npm run dev)", "Run local commands with prefix ! (example: !npm run dev)")}</span>
                  <div ref={terminalRef} className="studio-terminal">{terminalLines.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}</div>
                  <div className="studio-shell-row">
                    <input
                      type="text"
                      value={shellInput}
                      placeholder={tx("help | pull github https://github.com/owner/repo main | !npm run lint", "help | pull github https://github.com/owner/repo main | !npm run lint")}
                      onChange={(event) => setShellInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          runShellCommand();
                        }
                      }}
                    />
                    <button type="button" onClick={runShellCommand}>{tx("Ejecutar", "Run")}</button>
                  </div>
                </div>
              </details>
            </section>
          </div>
        </section>
        )}
      </div>
      {dragImportActive ? <div className="studio-drop-overlay">{tx("Suelta archivos para importarlos al proyecto actual", "Drop files to import into current project")}</div> : null}
    </main>
  );
}

