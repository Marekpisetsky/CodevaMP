
"use client";

import { Suspense, type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { devSupabase as supabase } from "@/app/lib/supabase";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import {
  STUDIO_BRIDGE_SETTINGS_LS_KEY,
  STUDIO_MODE_LS_KEY,
  STUDIO_ONBOARD_DONE_LS_KEY,
  STUDIO_TEMPLATES,
  STACK_OPTIONS,
  compareCommits,
  buildFileTree,
  buildInitialHistories,
  hasExtension,
  isValidStack,
  normalizeDependency,
  normalizePath,
  parentFolders,
  parseGithubRepoUrl,
  readWorkspace,
  toPreviewDocument,
  writeWorkspace,
  type CodeHistoryState,
  type ConsoleEntry,
  type FileTreeNode,
  type StackKey,
  type StudioRemoteCommit,
  type UndoSnapshot,
} from "./studio-core";
import {
  openGithubDevFromRepoUrl,
  promptAndOpenGithubDev,
  pullGithubRepoIntoWorkspaceOperation,
  pushWorkspaceToGithubOperation,
  verifyGithubRepoOperation,
} from "./studio-github";
import {
  connectLocalShellOperation,
  copyBridgeCommandOperation,
  runLocalShellCommandOperation,
} from "./studio-local-shell";
import {
  commitToCodevampRemoteOperation,
  createOrSwitchRemoteBranchOperation,
  loadCodevampRemoteCommitsOperation,
  mergeCurrentBranchIntoMainOperation,
  publishCurrentWorkspaceToDevOperation,
  restoreCodevampCommitOperation,
} from "./studio-remote";
import { StudioExpertOps } from "./studio-expert-ops";
import { StudioOnboarding } from "./studio-onboarding";
import { StudioTopbar } from "./studio-topbar";
import { StudioWorkspaceGate } from "./studio-workspace-gate";
import { StudioActionsBar } from "./studio-actions-bar";
import { StudioExplorerPane } from "./studio-explorer-pane";
import { StudioPreviewConsolePane } from "./studio-preview-console-pane";

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
  const [showExpertOps, setShowExpertOps] = useState(false);
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
  const bridgeStartCommand = useMemo(
    () => `powershell -ExecutionPolicy Bypass -File ".\\scripts\\start-local-shell-bridge.ps1"`,
    []
  );
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
      await loadCodevampRemoteCommitsOperation({
        projectIdValue,
        branchValue,
        remoteProjectId,
        remoteWorkspaceBranch,
        stack,
        sessionUserId,
        setRemoteStatus,
        setRemoteCommits,
        setRemoteMainHead,
      });
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
    openGithubDevFromRepoUrl(remoteRepoUrl, pushTerminal, importFromGithub);
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
    promptAndOpenGithubDev(pushTerminal);
  };

  const verifyGithubRepo = async (repoUrl: string) => {
    await verifyGithubRepoOperation({
      repoUrl,
      githubTokenInput,
      setGithubTokenInput,
      setRepoVerified,
      setRepoOwnerMatch,
      setVerifiedRepoUrl,
      setRepoVerificationNote,
      pushTerminal,
    });
  };

  const pullGithubRepoIntoWorkspace = async (repoUrl: string, branchOverride?: string) => {
    await pullGithubRepoIntoWorkspaceOperation({
      repoUrl,
      branchOverride,
      files,
      folderPaths,
      activeFile,
      dependencies,
      pushTerminal,
      pushUndo,
      setFiles,
      setFolderPaths,
      setCodeHistories,
      setActiveFile,
      setRepoVerificationNote,
    });
  };

  const commitToCodevampRemote = async (messageOverride?: string) => {
    await commitToCodevampRemoteOperation({
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
    });
  };

  const restoreCodevampCommit = async (commitId?: string) => {
    await restoreCodevampCommitOperation({
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
    });
  };

  const createOrSwitchRemoteBranch = async (branchOverride?: string) => {
    await createOrSwitchRemoteBranchOperation({
      branchOverride,
      remoteProjectId,
      remoteWorkspaceBranch,
      remoteNewBranch,
      stack,
      setRemoteWorkspaceBranch,
      setRemoteNewBranch,
      loadCodevampRemoteCommits,
      pushTerminal,
    });
  };

  const mergeCurrentBranchIntoMain = async () => {
    await mergeCurrentBranchIntoMainOperation({
      remoteProjectId,
      remoteWorkspaceBranch,
      stack,
      remoteCommits,
      sessionUserId,
      setRemoteMergeBusy,
      loadCodevampRemoteCommits,
      pushTerminal,
    });
  };

  const publishCurrentWorkspaceToDev = async () => {
    await publishCurrentWorkspaceToDevOperation({
      remoteWorkspaceBranch,
      remoteProjectId,
      stack,
      templateLabel: template.label,
      remoteCommits,
      setRemotePublishBusy,
      setRemotePublishNote,
      pushTerminal,
      tx,
      navigateToPublished: (id) => router.push(`/dev?published=${encodeURIComponent(id)}`),
    });
  };

  const switchToMainBranch = async () => {
    setRemoteWorkspaceBranch("main");
    await loadCodevampRemoteCommits(remoteProjectId, "main");
  };

  const pushWorkspaceToGithub = async (repoUrl: string, branchOverride?: string) => {
    await pushWorkspaceToGithubOperation({
      repoUrl,
      branchOverride,
      remoteBranch,
      repoVerified,
      verifiedRepoUrl,
      repoOwnerMatch,
      githubTokenInput,
      setGithubTokenInput,
      files,
      pushTerminal,
    });
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
      void runLocalShellCommandOperation({
        cmdValue,
        localBridgeConnected,
        localBridgeResolvedUrl,
        localBridgeUrl,
        localBridgeToken,
        setLocalBridgeConnected,
        setLocalBridgeResolvedUrl,
        pushTerminal,
      });
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
    await copyBridgeCommandOperation(bridgeStartCommand, pushTerminal);
  };

  const connectLocalShell = async () => {
    setLocalBridgeBusy(true);
    try {
      await connectLocalShellOperation({
        localBridgeUrl,
        localBridgeToken,
        setLocalBridgeConnected,
        setLocalBridgeResolvedUrl,
        pushTerminal,
      });
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
        <StudioTopbar
          title={tx("Dev Studio", "Dev Studio")}
          stackLabel={template.label}
          studioMode={studioMode}
          setStudioMode={setStudioMode}
          autosaveLabel={tx("Autosave local activo", "Local autosave active")}
          authHref={studioAuthHref}
          showAuthCta={!sessionUserId}
          signInLabel={tx("Iniciar sesion", "Sign in")}
          githubDevLabel={tx("Abrir en github.dev", "Open in github.dev")}
          onOpenGithubDev={openGithubDevFromRemote}
          languageLabel={language.toUpperCase()}
          onToggleLanguage={() => setUiLanguage(language === "es" ? "en" : "es")}
          backLabel={tx("Volver a Dev", "Back to Dev")}
          modeLabel={tx("Modo Studio", "Studio mode")}
          basicLabel={tx("Basico", "Basic")}
          proLabel="Pro"
        />

        {!hasSelectedWorkspace ? (
          <StudioWorkspaceGate
            title={tx("Selecciona un espacio de trabajo antes de entrar al studio", "Select a workspace before entering Studio")}
            description={tx("Elige un stack para evitar reemplazos accidentales de archivos.", "Pick one stack to avoid accidental file replacement.")}
            badge={tx("Inicio seguro requerido", "Safe start required")}
            stackOptions={STACK_OPTIONS}
            stackDescriptions={stackDescById}
          />
        ) : (
        <section className="dev-lab" aria-label={tx("Espacio de trabajo del studio", "Studio workspace")}>
          <div className="dev-lab__head dev-studio-head"><div><h2>{tx("Nucleo seguro del workspace", "Secure workspace core")}</h2>{studioMode === "basic" ? <p>{tx("Autosave activo y preview local seguro.", "Autosave active and safe local preview.")}</p> : null}</div><span className="dev-status dev-status--building">{tx("Workspace", "Workspace")}: {template.label}</span></div>

          {studioMode === "basic" && showOnboarding ? (
            <StudioOnboarding
              title={tx("Primeros pasos", "Quick start")}
              steps={onboardingItems}
              stepIndex={onboardingStep}
              previousLabel={tx("Anterior", "Previous")}
              nextLabel={tx("Siguiente", "Next")}
              doneLabel={tx("Entendido", "Got it")}
              onPrevious={() => setOnboardingStep((prev) => Math.max(0, prev - 1))}
              onNext={() => setOnboardingStep((prev) => Math.min(onboardingItems.length - 1, prev + 1))}
              onDone={completeOnboarding}
            />
          ) : null}

          <StudioActionsBar
            publishLabel={tx("Ir a /dev para publicar", "Go to /dev to publish")}
            advancedLabel={tx("Herramientas avanzadas", "Advanced tools")}
            hideAdvancedLabel={tx("Ocultar avanzado", "Hide advanced")}
            showAdvancedTools={showAdvancedTools}
            onToggleAdvanced={() => setShowAdvancedTools((prev) => !prev)}
            studioMode={studioMode}
            showGuideLabel={tx("Mostrar guia", "Show guide")}
            hideGuideLabel={tx("Ocultar guia", "Hide guide")}
            viewGuideLabel={tx("Ver guia", "View guide")}
            showOnboarding={showOnboarding}
            onboardingDone={onboardingDone}
            onToggleGuide={() => setShowOnboarding((prev) => !prev)}
            autosaveLabel={tx("Autosave ON", "Autosave ON")}
            autosavePulse={autosavePulse}
            uploadInputRef={uploadInputRef}
            folderUploadInputRef={folderUploadInputRef}
            onUploadFiles={onUploadFiles}
          />

          {showAdvancedTools ? (
            <div className="studio-advanced">
              <button type="button" onClick={undoStructure} disabled={!undoStack.length}>{tx("Deshacer estructura", "Undo structure")}</button>
              <button type="button" onClick={copyWorkspaceJson}>{tx("Copiar JSON del workspace", "Copy workspace JSON")}</button>
              <button type="button" onClick={() => uploadInputRef.current?.click()}>{tx("Importar archivos", "Import files")}</button>
              <button type="button" onClick={() => folderUploadInputRef.current?.click()}>{tx("Importar carpeta", "Import folder")}</button>
              <button type="button" onClick={exportWorkspaceZip}>{tx("Exportar ZIP", "Export ZIP")}</button>
              <button type="button" onClick={() => setLivePreview((prev) => !prev)}>{livePreview ? tx("Preview en vivo ON", "Live preview ON") : tx("Preview en vivo OFF", "Live preview OFF")}</button>
              <button type="button" onClick={() => setPreviewFocus((prev) => !prev)}>{previewFocus ? tx("Mostrar editor", "Show editor") : tx("Enfocar preview", "Focus preview")}</button>
              <button type="button" onClick={() => setShowExpertOps((prev) => !prev)}>
                {showExpertOps ? tx("Ocultar operaciones expertas", "Hide expert operations") : tx("Operaciones expertas", "Expert operations")}
              </button>
              <span className={`studio-autosave${autosavePulse ? " is-pulse" : ""}`}>{tx("Autosave ON", "Autosave ON")}</span>
            </div>
          ) : null}

          <div className={`studio-grid${previewFocus ? " is-preview-focus" : ""}`}>
            <StudioExplorerPane
              title={tx("Explorer", "Explorer")}
              newLabel={tx("Nuevo", "New")}
              onCreateEntry={createEntryPrompt}
              dragFilePath={dragFilePath}
              dropLabel={tx("Suelta aqui para mover archivo a la raiz", "Drop here to move file to root")}
              onDropToRoot={(source) => moveFileToFolder(source, "")}
              tree={renderTree(fileTree)}
            />

            <section className="dev-card studio-pane studio-editor-pane">
              <div className="dev-card__head"><h2 className="studio-heading">{activeFile}</h2><span className="dev-status dev-status--building">{tx("editando", "editing")}</span></div>
              {studioMode === "basic" ? <p className="studio-hint">{tx("Atajos: Ctrl+S guardar, Ctrl+Z deshacer, Ctrl+Y rehacer.", "Shortcuts: Ctrl+S save, Ctrl+Z undo, Ctrl+Y redo.")}</p> : null}
              <textarea value={files[activeFile] ?? ""} onChange={(event) => onChangeCode(event.target.value)} onKeyDown={handleEditorKeyDown} spellCheck={false} className="studio-editor" />
            </section>

            <StudioPreviewConsolePane
              tx={tx}
              stack={stack}
              previewDoc={previewDoc}
              setPreviewFocus={setPreviewFocus}
              openPreviewInNewTab={openPreviewInNewTab}
              templateNotes={template.notes}
              studioMode={studioMode}
              dependencyInput={dependencyInput}
              setDependencyInput={setDependencyInput}
              addDependency={addDependency}
              dependencies={dependencies}
              removeDependency={removeDependency}
              consoleEntries={consoleEntries}
              clearConsole={() => setConsoleEntries([])}
            >
              {showExpertOps ? (
                <StudioExpertOps
                  tx={tx}
                  stack={stack}
                  studioAuthHref={studioAuthHref}
                  showGitSyncPanel={showGitSyncPanel}
                  setShowGitSyncPanel={setShowGitSyncPanel}
                  sessionUserId={sessionUserId}
                  remoteProjectId={remoteProjectId}
                  setRemoteProjectId={setRemoteProjectId}
                  remoteWorkspaceBranch={remoteWorkspaceBranch}
                  setRemoteWorkspaceBranch={setRemoteWorkspaceBranch}
                  remoteNewBranch={remoteNewBranch}
                  setRemoteNewBranch={setRemoteNewBranch}
                  remoteCommitMessage={remoteCommitMessage}
                  setRemoteCommitMessage={setRemoteCommitMessage}
                  remoteStatus={remoteStatus}
                  remoteCommits={remoteCommits}
                  remotePublishBusy={remotePublishBusy}
                  remotePublishNote={remotePublishNote}
                  remoteDiffSummary={remoteDiffSummary}
                  remoteMergeBusy={remoteMergeBusy}
                  loadCodevampRemoteCommits={loadCodevampRemoteCommits}
                  createOrSwitchRemoteBranch={createOrSwitchRemoteBranch}
                  commitToCodevampRemote={commitToCodevampRemote}
                  publishCurrentWorkspaceToDev={publishCurrentWorkspaceToDev}
                  restoreCodevampCommit={restoreCodevampCommit}
                  switchToMainBranch={switchToMainBranch}
                  mergeCurrentBranchIntoMain={mergeCurrentBranchIntoMain}
                  remoteRepoUrl={remoteRepoUrl}
                  setRemoteRepoUrl={setRemoteRepoUrl}
                  remoteBranch={remoteBranch}
                  setRemoteBranch={setRemoteBranch}
                  githubTokenInput={githubTokenInput}
                  setGithubTokenInput={setGithubTokenInput}
                  hasValidRepoUrl={hasValidRepoUrl}
                  repoVerificationNote={repoVerificationNote}
                  repoVerified={repoVerified}
                  repoOwnerMatch={repoOwnerMatch}
                  importFromGithub={importFromGithub}
                  pullGithubRepoIntoWorkspace={pullGithubRepoIntoWorkspace}
                  verifyGithubRepo={verifyGithubRepo}
                  pushWorkspaceToGithub={pushWorkspaceToGithub}
                  copyBridgeCommand={copyBridgeCommand}
                  connectLocalShell={connectLocalShell}
                  localBridgeBusy={localBridgeBusy}
                  localBridgeConnected={localBridgeConnected}
                  showBridgeAdvanced={showBridgeAdvanced}
                  setShowBridgeAdvanced={setShowBridgeAdvanced}
                  localBridgeUrl={localBridgeUrl}
                  setLocalBridgeUrl={setLocalBridgeUrl}
                  localBridgeToken={localBridgeToken}
                  setLocalBridgeToken={setLocalBridgeToken}
                  terminalRef={terminalRef}
                  terminalLines={terminalLines}
                  shellInput={shellInput}
                  setShellInput={setShellInput}
                  runShellCommand={runShellCommand}
                />
              ) : null}
            </StudioPreviewConsolePane>
          </div>
        </section>
        )}
      </div>
      {dragImportActive ? <div className="studio-drop-overlay">{tx("Suelta archivos para importarlos al proyecto actual", "Drop files to import into current project")}</div> : null}
    </main>
  );
}

