"use client";

import { getBridgeCandidates } from "./studio-core";

type PushTerminal = (message: string) => void;

export async function copyBridgeCommandOperation(command: string, pushTerminal: PushTerminal) {
  try {
    await navigator.clipboard.writeText(command);
    pushTerminal("bridge command copied");
  } catch {
    pushTerminal("failed to copy bridge command");
  }
}

export async function connectLocalShellOperation(args: {
  localBridgeUrl: string;
  localBridgeToken: string;
  setLocalBridgeConnected: (value: boolean) => void;
  setLocalBridgeResolvedUrl: (value: string) => void;
  pushTerminal: PushTerminal;
}) {
  const { localBridgeUrl, localBridgeToken, setLocalBridgeConnected, setLocalBridgeResolvedUrl, pushTerminal } = args;
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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "health", target: candidate, token: localBridgeToken }),
      });
      const payload = (await response.json()) as { ok?: boolean; status?: number; error?: string };
      if (!response.ok || payload.ok === false) {
        if (payload.status === 401) {
          setLocalBridgeConnected(false);
          setLocalBridgeResolvedUrl("");
          pushTerminal("local shell token rejected (401). Update token or clear token.");
          return;
        }
        if (payload.error) pushTerminal(`bridge probe failed on ${candidate}: ${payload.error}`);
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
}

export async function runLocalShellCommandOperation(args: {
  cmdValue: string;
  localBridgeConnected: boolean;
  localBridgeResolvedUrl: string;
  localBridgeUrl: string;
  localBridgeToken: string;
  setLocalBridgeConnected: (value: boolean) => void;
  setLocalBridgeResolvedUrl: (value: string) => void;
  pushTerminal: PushTerminal;
}) {
  const { cmdValue, localBridgeConnected, localBridgeResolvedUrl, localBridgeUrl, localBridgeToken, setLocalBridgeConnected, setLocalBridgeResolvedUrl, pushTerminal } = args;
  if (!cmdValue) {
    pushTerminal("local shell: empty command");
    return;
  }
  if (!localBridgeConnected) {
    pushTerminal("local shell not connected. Use Connect local shell first.");
    return;
  }
  try {
    const bridgeBase = (localBridgeResolvedUrl || localBridgeUrl).replace(/\/$/, "");
    const response = await fetch("/api/dev/bridge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "exec", target: bridgeBase, token: localBridgeToken, cmd: cmdValue }),
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
    if (data.stdout) data.stdout.split(/\r?\n/).filter(Boolean).forEach((line) => pushTerminal(`[local] ${line}`));
    if (data.stderr) data.stderr.split(/\r?\n/).filter(Boolean).forEach((line) => pushTerminal(`[local:err] ${line}`));
    pushTerminal(`local shell exit code ${data.code ?? 0}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    setLocalBridgeConnected(false);
    setLocalBridgeResolvedUrl("");
    pushTerminal(`local shell unreachable: ${message}`);
  }
}
