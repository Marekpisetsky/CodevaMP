import { NextResponse } from "next/server";

type BridgePayload = {
  action?: "health" | "exec";
  target?: string;
  token?: string;
  cmd?: string;
  cwd?: string;
  timeoutMs?: number;
};

function isValidBridgeTarget(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const allowedHost = host === "127.0.0.1" || host === "localhost";
    const allowedProtocol = url.protocol === "http:" || url.protocol === "https:";
    return allowedHost && allowedProtocol;
  } catch {
    return false;
  }
}

function bridgeHeaders(token?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token?.trim()) headers["x-studio-bridge-token"] = token.trim();
  return headers;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Bridge proxy only available in development." }, { status: 403 });
  }

  let payload: BridgePayload;
  try {
    payload = (await request.json()) as BridgePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = payload.action;
  const target = (payload.target || "").trim().replace(/\/$/, "");
  if (!action || !target) {
    return NextResponse.json({ ok: false, error: "Missing action or target." }, { status: 400 });
  }
  if (!isValidBridgeTarget(target)) {
    return NextResponse.json({ ok: false, error: "Invalid bridge target. Use localhost or 127.0.0.1." }, { status: 400 });
  }

  try {
    if (action === "health") {
      const response = await fetch(`${target}/health`, {
        method: "GET",
        headers: payload.token?.trim() ? { "x-studio-bridge-token": payload.token.trim() } : undefined,
        cache: "no-store",
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = text;
      }
      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        target,
        data: parsed,
      });
    }

    if (action === "exec") {
      const cmd = (payload.cmd || "").trim();
      if (!cmd) {
        return NextResponse.json({ ok: false, error: "Missing command." }, { status: 400 });
      }
      const bridgeResponse = await fetch(`${target}/exec`, {
        method: "POST",
        headers: bridgeHeaders(payload.token),
        body: JSON.stringify({
          cmd,
          cwd: payload.cwd,
          timeoutMs: payload.timeoutMs,
        }),
        cache: "no-store",
      });
      const text = await bridgeResponse.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { error: "Bridge returned non-JSON response." };
      }
      return NextResponse.json({
        ok: bridgeResponse.ok,
        status: bridgeResponse.status,
        target,
        data: parsed,
      });
    }

    return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bridge request failed.";
    return NextResponse.json({ ok: false, error: message, target }, { status: 200 });
  }
}

