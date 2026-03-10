import http from "node:http";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const PORT = Number(process.env.LOCAL_SHELL_BRIDGE_PORT || 4173);
const HOST = process.env.LOCAL_SHELL_BRIDGE_HOST || "127.0.0.1";
const TOKEN = (process.env.LOCAL_SHELL_BRIDGE_TOKEN || "").trim();
const DEFAULT_CWD = process.env.LOCAL_SHELL_BRIDGE_CWD || process.cwd();
const MAX_OUTPUT = Number(process.env.LOCAL_SHELL_BRIDGE_MAX_OUTPUT || 250000);
const DEFAULT_TIMEOUT_MS = Number(process.env.LOCAL_SHELL_BRIDGE_TIMEOUT_MS || 30000);
const ALLOW_PREFIXES = (process.env.LOCAL_SHELL_BRIDGE_ALLOW || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set(
  (process.env.LOCAL_SHELL_BRIDGE_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const withCors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-studio-bridge-token");
};

const sendJson = (req, res, status, payload) => {
  withCors(req, res);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString("utf8");
      if (data.length > 1_000_000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

const hasValidToken = (req) => {
  if (!TOKEN) return true;
  const provided = (req.headers["x-studio-bridge-token"] || "").toString().trim();
  return provided && provided === TOKEN;
};

const commandAllowed = (cmd) => {
  if (!ALLOW_PREFIXES.length) return true;
  return ALLOW_PREFIXES.some((prefix) => cmd.startsWith(prefix));
};

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(req, res, 400, { error: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    withCors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (!hasValidToken(req)) {
    sendJson(req, res, 401, { error: "Invalid bridge token" });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(req, res, 200, {
      ok: true,
      service: "local-shell-bridge",
      cwd: DEFAULT_CWD,
      restricted: Boolean(ALLOW_PREFIXES.length),
    });
    return;
  }

  if (req.method === "POST" && req.url === "/exec") {
    try {
      const raw = await readBody(req);
      const parsed = raw ? JSON.parse(raw) : {};
      const cmd = (parsed.cmd || "").toString().trim();
      const cwd = (parsed.cwd || DEFAULT_CWD).toString();
      const timeoutMs = Number(parsed.timeoutMs || DEFAULT_TIMEOUT_MS);

      if (!cmd) {
        sendJson(req, res, 400, { error: "Missing command" });
        return;
      }
      if (!commandAllowed(cmd)) {
        sendJson(req, res, 403, { error: "Command prefix not allowed by LOCAL_SHELL_BRIDGE_ALLOW" });
        return;
      }

      const { stdout, stderr } = await execAsync(cmd, {
        cwd,
        timeout: timeoutMs,
        maxBuffer: MAX_OUTPUT,
        windowsHide: true,
      });

      sendJson(req, res, 200, {
        ok: true,
        code: 0,
        stdout: stdout?.toString() || "",
        stderr: stderr?.toString() || "",
      });
      return;
    } catch (error) {
      const err = error;
      sendJson(req, res, 200, {
        ok: false,
        code: typeof err?.code === "number" ? err.code : 1,
        stdout: err?.stdout?.toString?.() || "",
        stderr: err?.stderr?.toString?.() || "",
        error: err?.message || "Command execution failed",
      });
      return;
    }
  }

  sendJson(req, res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(
    `[local-shell-bridge] listening on http://${HOST}:${PORT} | cwd=${DEFAULT_CWD} | token=${TOKEN ? "enabled" : "disabled"}`
  );
});
