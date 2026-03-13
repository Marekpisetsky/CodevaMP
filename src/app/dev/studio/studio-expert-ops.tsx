"use client";

import Link from "next/link";
import type { RefObject } from "react";

import type { StudioRemoteCommit, StackKey } from "./studio-core";

type Tx = (es: string, en: string) => string;

type RemoteDiffSummary = {
  added: number;
  changed: number;
  removed: number;
  dependencyChanged: boolean;
} | null;

type StudioExpertOpsProps = {
  tx: Tx;
  stack: StackKey;
  studioAuthHref: string;
  showGitSyncPanel: boolean;
  setShowGitSyncPanel: (value: boolean | ((prev: boolean) => boolean)) => void;
  sessionUserId: string | null | undefined;
  remoteProjectId: string;
  setRemoteProjectId: (value: string) => void;
  remoteWorkspaceBranch: string;
  setRemoteWorkspaceBranch: (value: string) => void;
  remoteNewBranch: string;
  setRemoteNewBranch: (value: string) => void;
  remoteCommitMessage: string;
  setRemoteCommitMessage: (value: string) => void;
  remoteStatus: "cloud" | "local";
  remoteCommits: StudioRemoteCommit[];
  remotePublishBusy: boolean;
  remotePublishNote: string | null;
  remoteDiffSummary: RemoteDiffSummary;
  remoteMergeBusy: boolean;
  loadCodevampRemoteCommits: (projectIdValue?: string, branchValue?: string) => Promise<void>;
  createOrSwitchRemoteBranch: (branchOverride?: string) => Promise<void>;
  commitToCodevampRemote: (messageOverride?: string) => Promise<void>;
  publishCurrentWorkspaceToDev: () => Promise<void>;
  restoreCodevampCommit: (commitId?: string) => Promise<void>;
  switchToMainBranch: () => Promise<void>;
  mergeCurrentBranchIntoMain: () => Promise<void>;
  remoteRepoUrl: string;
  setRemoteRepoUrl: (value: string) => void;
  remoteBranch: string;
  setRemoteBranch: (value: string) => void;
  githubTokenInput: string;
  setGithubTokenInput: (value: string) => void;
  hasValidRepoUrl: boolean;
  repoVerificationNote: string;
  repoVerified: boolean;
  repoOwnerMatch: boolean;
  importFromGithub: () => void;
  pullGithubRepoIntoWorkspace: (repoUrl: string, branchOverride?: string) => Promise<void>;
  verifyGithubRepo: (repoUrl: string) => Promise<void>;
  pushWorkspaceToGithub: (repoUrl: string, branchOverride?: string) => Promise<void>;
  copyBridgeCommand: () => Promise<void>;
  connectLocalShell: () => Promise<void>;
  localBridgeBusy: boolean;
  localBridgeConnected: boolean;
  showBridgeAdvanced: boolean;
  setShowBridgeAdvanced: (value: boolean | ((prev: boolean) => boolean)) => void;
  localBridgeUrl: string;
  setLocalBridgeUrl: (value: string) => void;
  localBridgeToken: string;
  setLocalBridgeToken: (value: string) => void;
  terminalRef: RefObject<HTMLDivElement | null>;
  terminalLines: string[];
  shellInput: string;
  setShellInput: (value: string) => void;
  runShellCommand: () => void;
};

export function StudioExpertOps(props: StudioExpertOpsProps) {
  const {
    tx,
    stack,
    studioAuthHref,
    showGitSyncPanel,
    setShowGitSyncPanel,
    sessionUserId,
    remoteProjectId,
    setRemoteProjectId,
    remoteWorkspaceBranch,
    setRemoteWorkspaceBranch,
    remoteNewBranch,
    setRemoteNewBranch,
    remoteCommitMessage,
    setRemoteCommitMessage,
    remoteStatus,
    remoteCommits,
    remotePublishBusy,
    remotePublishNote,
    remoteDiffSummary,
    remoteMergeBusy,
    loadCodevampRemoteCommits,
    createOrSwitchRemoteBranch,
    commitToCodevampRemote,
    publishCurrentWorkspaceToDev,
    restoreCodevampCommit,
    switchToMainBranch,
    mergeCurrentBranchIntoMain,
    remoteRepoUrl,
    setRemoteRepoUrl,
    remoteBranch,
    setRemoteBranch,
    githubTokenInput,
    setGithubTokenInput,
    hasValidRepoUrl,
    repoVerificationNote,
    repoVerified,
    repoOwnerMatch,
    importFromGithub,
    pullGithubRepoIntoWorkspace,
    verifyGithubRepo,
    pushWorkspaceToGithub,
    copyBridgeCommand,
    connectLocalShell,
    localBridgeBusy,
    localBridgeConnected,
    showBridgeAdvanced,
    setShowBridgeAdvanced,
    localBridgeUrl,
    setLocalBridgeUrl,
    localBridgeToken,
    setLocalBridgeToken,
    terminalRef,
    terminalLines,
    shellInput,
    setShellInput,
    runShellCommand,
  } = props;

  return (
    <details className="studio-panel" open>
      <summary>{tx("Operaciones expertas", "Expert operations")}</summary>
      <div className="studio-shell">
        <div className="studio-token-state">
          {tx(
            "Usa esta capa solo si necesitas remoto CodevaMP, GitHub sync o shell local. El flujo principal de Studio es editar, previsualizar y publicar.",
            "Use this layer only when you need CodevaMP remote, GitHub sync, or the local shell. The main Studio flow is edit, preview, and publish."
          )}
        </div>
      </div>

      <details className="studio-panel" style={{ marginTop: ".5rem" }}>
        <summary>{tx("Remoto CodevaMP", "CodevaMP Remote")}</summary>
        <div className="studio-shell">
          <div className="studio-remote-meta">
            <span className="studio-token-state">Proyecto: {remoteProjectId.trim() || `dev-${stack}`}</span>
            <span className="studio-token-state">Branch: {remoteWorkspaceBranch.trim() || "main"}</span>
            <span className="studio-token-state">{tx("Estado", "Status")}: {remoteStatus === "cloud" ? "Cloud" : tx("Local", "Local")}</span>
            <span className="studio-token-state">{tx("Commits", "Commits")}: {remoteCommits.length}</span>
          </div>
          <div className="studio-shell-row">
            <input
              type="text"
              value={remoteProjectId}
              placeholder={tx("project id (ej: dev-canvas)", "project id (e.g.: dev-canvas)")}
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
      </details>

      <div className="studio-shell-row" style={{ margin: ".5rem 0" }}>
        <span className="studio-token-state">{tx("GitHub sync es opcional. El remoto principal es CodevaMP.", "GitHub sync is optional. CodevaMP is the main remote.")}</span>
        <button type="button" onClick={() => setShowGitSyncPanel((prev) => !prev)}>
          {showGitSyncPanel ? tx("Ocultar Git sync", "Hide Git sync") : tx("Mostrar Git sync", "Show Git sync")}
        </button>
      </div>

      <details className="studio-panel" style={{ marginTop: ".5rem" }} open={showGitSyncPanel}>
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

      <details className="studio-panel" style={{ marginTop: ".5rem" }} open={false}>
        <summary>{tx("Shell local", "Local shell")}</summary>
        <div className="studio-shell">
          <div className="studio-shell-row">
            <button type="button" onClick={() => void copyBridgeCommand()}>{tx("Copiar comando inicial", "Copy start command")}</button>
            <button type="button" onClick={() => void connectLocalShell()} disabled={localBridgeBusy}>
              {localBridgeConnected ? tx("Shell local conectada", "Local shell connected") : localBridgeBusy ? tx("Conectando...", "Connecting...") : tx("Conectar shell local", "Connect local shell")}
            </button>
          </div>
          <span className="studio-token-state">{tx("Ejecuta el comando desde la raiz del repo y luego conecta la shell local.", "Run the command from the repo root and then connect the local shell.")}</span>
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
    </details>
  );
}
