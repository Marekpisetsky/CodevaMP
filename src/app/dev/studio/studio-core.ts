/* Dev Studio core: types, constants and pure helpers */

export type StackKey = "web" | "react" | "next" | "node" | "python";

export type StudioTemplate = {
  label: string;
  files: Record<string, string>;
  folderPaths: string[];
  notes: string;
};

export type WorkspaceSnapshot = {
  files: Record<string, string>;
  folderPaths: string[];
  activeFile: string;
  dependencies: string[];
};

export type StudioRemoteCommit = WorkspaceSnapshot & {
  id: string;
  message: string;
  createdAt: string;
  stack: StackKey;
  branch: string;
};

export type UndoSnapshot = WorkspaceSnapshot & { label: string };
export type CodeHistoryState = Record<string, { entries: string[]; index: number }>;

export type FileTreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  children?: FileTreeNode[];
};

export type ConsoleEntry = {
  id: string;
  level: "log" | "warn" | "error";
  message: string;
  location?: string;
  time: string;
};

export const WORKSPACE_LS_KEY = "codevamp_dev_studio_workspace_v2";
export const STUDIO_MODE_LS_KEY = "codevamp_dev_studio_mode_v1";
export const STUDIO_ONBOARD_DONE_LS_KEY = "codevamp_dev_studio_onboard_done_v1";
export const STUDIO_BRIDGE_SETTINGS_LS_KEY = "codevamp_dev_studio_bridge_v1";
export const STUDIO_REMOTE_LS_KEY = "codevamp_dev_remote_v1";
export const STUDIO_REMOTE_RETENTION = 100;
export const STUDIO_REMOTE_MAX_COMMIT_BYTES = 1_500_000;

export const STUDIO_TEMPLATES: Record<StackKey, StudioTemplate> = {
  web: {
    label: "Web (HTML/CSS/JS)",
    files: {
      "document.html": `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width,initial-scale=1" />\n  <title>CodevaMP Dev Studio</title>\n  <style>{{styles}}</style>\n</head>\n<body>\n  <main class="app">\n    <h1>CodevaMP Dev Studio</h1>\n    <p>Build fast, test fast.</p>\n    <button id="cta">Run idea</button>\n    <p id="status">Ready.</p>\n  </main>\n  <script>{{script}}</script>\n</body>\n</html>`,
      "styles.css": `body{font-family:Inter,system-ui,sans-serif;background:#08111f;color:#e8eef9;margin:0;padding:28px}.app{max-width:760px;margin:0 auto}button{border:0;border-radius:999px;padding:10px 14px;background:#16a34a;color:#fff;font-weight:700}`,
      "app.js": `const cta=document.getElementById("cta");const status=document.getElementById("status");cta?.addEventListener("click",()=>{if(status)status.textContent="Prototype running.";});console.log("Web studio ready");`,
      "src/components/hero.txt": "Add your component notes here.",
      "public/readme.txt": "Static assets folder",
    },
    folderPaths: ["src", "src/components", "public"],
    notes: "Live preview available in this studio.",
  },
  react: {
    label: "React + TypeScript",
    files: {
      "src/main.tsx": `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./styles.css";\n\ncreateRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);`,
      "src/App.tsx": `export default function App(){\n  return <main><h1>React Workspace</h1><p>Start shipping components.</p></main>;\n}`,
      "src/styles.css": `body{font-family:Inter,system-ui,sans-serif;margin:0;padding:24px;background:#0a1221;color:#eaf1ff}`,
      "public/index.html": `<div id="root"></div>`,
      "package.json": `{"name":"react-studio","private":true}`,
    },
    folderPaths: ["src", "public"],
    notes: "Use external workspace for full runtime and package install.",
  },
  next: {
    label: "Next.js",
    files: {
      "app/page.tsx": `export default function Page(){\n  return <main><h1>Next Workspace</h1><p>Route and iterate.</p></main>;\n}`,
      "app/layout.tsx": `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}`,
      "app/globals.css": `body{margin:0;padding:24px;background:#081221;color:#eaf1ff}`,
      "public/readme.txt": "public assets",
      "package.json": `{"name":"next-studio","private":true}`,
    },
    folderPaths: ["app", "public"],
    notes: "Use external workspace to run full Next.js.",
  },
  node: {
    label: "Node API",
    files: {
      "src/server.js": `import http from "node:http";\n\nconst server = http.createServer((_req, res) => {\n  res.writeHead(200, { "content-type": "application/json" });\n  res.end(JSON.stringify({ ok: true, service: "dev-studio" }));\n});\n\nserver.listen(3001, () => console.log("API running on :3001"));`,
      "src/routes/health.txt": "GET /health",
      "package.json": `{"name":"dev-api","type":"module","scripts":{"dev":"node src/server.js"}}`,
      "README.md": "# Node API\\nRun npm run dev in external workspace.",
    },
    folderPaths: ["src", "src/routes"],
    notes: "Server runtime requires external workspace.",
  },
  python: {
    label: "Python",
    files: {
      "src/main.py": `def greet(name: str) -> str:\n    return f"Hello, {name}"\n\nif __name__ == "__main__":\n    print(greet("CodevaMP"))`,
      "src/modules/readme.txt": "Add modules in this folder.",
      "requirements.txt": "",
      "README.md": "Run in external workspace for Python runtime.",
    },
    folderPaths: ["src", "src/modules"],
    notes: "Python execution requires external workspace.",
  },
};

export const STACK_OPTIONS: Array<{ id: StackKey; label: string; desc: string }> = [
  { id: "web", label: "Web", desc: "HTML/CSS/JS with live preview" },
  { id: "react", label: "React", desc: "Components + TS starter" },
  { id: "next", label: "Next.js", desc: "App router structure" },
  { id: "node", label: "Node API", desc: "Server-first workspace" },
  { id: "python", label: "Python", desc: "Script and module structure" },
];
export function isValidStack(value: string | null): value is StackKey {
  return value === "react" || value === "next" || value === "node" || value === "python" || value === "web";
}

export function normalizeDependency(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function normalizePath(value: string) {
  return value.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function getBridgeCandidates(rawUrl: string) {
  const base = rawUrl.trim();
  if (!base) return [];
  try {
    const parsed = new URL(base);
    const candidates = new Set<string>();
    const push = (url: URL) => candidates.add(url.toString().replace(/\/$/, ""));
    push(parsed);

    const swapHost =
      parsed.hostname === "localhost"
        ? "127.0.0.1"
        : parsed.hostname === "127.0.0.1"
          ? "localhost"
          : "";
    if (swapHost) {
      const altHost = new URL(parsed.toString());
      altHost.hostname = swapHost;
      push(altHost);
    }

    if (parsed.protocol === "https:") {
      const altProtocol = new URL(parsed.toString());
      altProtocol.protocol = "http:";
      push(altProtocol);
    }

    return Array.from(candidates);
  } catch {
    return [base.replace(/\/$/, "")];
  }
}

export function parseGithubRepoUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
  };
}

export function encodePathForGithub(path: string) {
  return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function toBase64Utf8(input: string) {
  return btoa(unescape(encodeURIComponent(input)));
}

export function hasExtension(path: string) {
  const leaf = path.split("/").pop() ?? "";
  return leaf.includes(".");
}

export function parentFolders(path: string) {
  const parts = path.split("/").filter(Boolean);
  const folders: string[] = [];
  for (let i = 1; i < parts.length; i += 1) {
    folders.push(parts.slice(0, i).join("/"));
  }
  return folders;
}

export function formatProjectTitleFromId(projectId: string) {
  const clean = normalizePath(projectId);
  if (!clean) return "Proyecto Dev";
  return clean
    .split("/")
    .pop()
    ?.split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Proyecto Dev";
}

export function buildInitialHistories(sourceFiles: Record<string, string>): CodeHistoryState {
  return Object.fromEntries(Object.entries(sourceFiles).map(([name, content]) => [name, { entries: [content], index: 0 }]));
}

export function stripSourceMapDirectives(value: string) {
  return value
    .replace(/\/[*/][#@]\s*sourceMappingURL=.*$/gim, "")
    .replace(/<!--[#@]\s*sourceMappingURL=.*?-->/gim, "");
}

export function toPreviewDocument(files: Record<string, string>, dependencies: string[]) {
  const rawTemplate = files["document.html"] ?? "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>{{styles}}</style></head><body>{{body}}<script>{{script}}</script></body></html>";
  const rawCss = files["styles.css"] ?? files["src/styles.css"] ?? "";
  const rawFallbackBody = files["index.html"] ?? "<main><h1>Preview</h1></main>";
  const rawJs = files["app.js"] ?? files["src/main.js"] ?? "";
  const template = stripSourceMapDirectives(rawTemplate);
  const css = stripSourceMapDirectives(rawCss);
  const fallbackBody = stripSourceMapDirectives(rawFallbackBody);
  const js = stripSourceMapDirectives(rawJs);
  const depLoader = dependencies.length ? `\nconst deps=${JSON.stringify(dependencies)};Promise.all(deps.map((dep)=>import(\`https://esm.sh/\${dep}\`))).then(()=>console.log("deps loaded",deps)).catch((err)=>console.warn("dep load failed",err));` : "";

  const bridge = `(function(){const send=(level,message,location)=>{try{window.parent.postMessage({source:"dev-studio-preview",level,message:String(message),location:location||""},"*");}catch{}};["log","warn","error"].forEach((k)=>{const base=console[k];console[k]=(...args)=>{send(k,args.map((a)=>typeof a==="string"?a:JSON.stringify(a)).join(" "));base.apply(console,args);};});window.addEventListener("error",(event)=>{send("error",event.message||"Runtime error",\`line \${event.lineno||"?"}, col \${event.colno||"?"}\`);});window.addEventListener("unhandledrejection",(event)=>{const msg=event.reason?.message||String(event.reason||"Unhandled rejection");send("error",msg,"promise");});})();`;

  let doc = template;
  doc = doc.includes("{{styles}}") ? doc.replace("{{styles}}", css) : doc.replace("</head>", `<style>${css}</style></head>`);
  doc = doc.includes("{{body}}") ? doc.replace("{{body}}", fallbackBody) : doc;
  const scriptPayload = `${bridge}\n${js}\n${depLoader}\n//# sourceURL=studio-user-script.js`;
  doc = doc.includes("{{script}}") ? doc.replace("{{script}}", scriptPayload) : doc.replace("</body>", `<script>${scriptPayload}<\\/script></body>`);
  return doc;
}

export function readWorkspace(stack: StackKey): WorkspaceSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Record<StackKey, WorkspaceSnapshot>>;
    const snapshot = parsed[stack];
    if (!snapshot || !snapshot.files || !Object.keys(snapshot.files).length) return null;
    const active = snapshot.activeFile && snapshot.files[snapshot.activeFile] ? snapshot.activeFile : Object.keys(snapshot.files)[0];
    return {
      files: snapshot.files,
      folderPaths: Array.isArray(snapshot.folderPaths) ? snapshot.folderPaths : [],
      activeFile: active,
      dependencies: Array.isArray(snapshot.dependencies) ? snapshot.dependencies : [],
    };
  } catch {
    return null;
  }
}

export function writeWorkspace(stack: StackKey, snapshot: WorkspaceSnapshot) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(WORKSPACE_LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Record<StackKey, WorkspaceSnapshot>>) : {};
    parsed[stack] = snapshot;
    window.localStorage.setItem(WORKSPACE_LS_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function remoteLocalKey(projectId: string, branch: string) {
  const safeProject = normalizePath(projectId) || "dev-web";
  const safeBranch = normalizePath(branch).replace(/\//g, "__") || "main";
  return `${safeProject}::${safeBranch}`;
}

export function readLocalRemoteCommits(projectId: string, branch: string): StudioRemoteCommit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STUDIO_REMOTE_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, StudioRemoteCommit[]>;
    const rows = parsed[remoteLocalKey(projectId, branch)];
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      ...row,
      branch: row.branch || (normalizePath(branch) || "main"),
    }));
  } catch {
    return [];
  }
}

export function writeLocalRemoteCommits(projectId: string, branch: string, commits: StudioRemoteCommit[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STUDIO_REMOTE_LS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, StudioRemoteCommit[]>) : {};
    parsed[remoteLocalKey(projectId, branch)] = commits.slice(0, STUDIO_REMOTE_RETENTION);
    window.localStorage.setItem(STUDIO_REMOTE_LS_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function estimateWorkspaceBytes(snapshot: WorkspaceSnapshot) {
  try {
    return new Blob([
      JSON.stringify({
        files: snapshot.files,
        folderPaths: snapshot.folderPaths,
        activeFile: snapshot.activeFile,
        dependencies: snapshot.dependencies,
      }),
    ]).size;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function compareCommits(baseCommit?: StudioRemoteCommit, targetCommit?: StudioRemoteCommit) {
  if (!baseCommit || !targetCommit) {
    return null;
  }
  const baseFiles = baseCommit.files || {};
  const targetFiles = targetCommit.files || {};
  const baseKeys = new Set(Object.keys(baseFiles));
  const targetKeys = new Set(Object.keys(targetFiles));

  let added = 0;
  let removed = 0;
  let changed = 0;

  targetKeys.forEach((key) => {
    if (!baseKeys.has(key)) {
      added += 1;
      return;
    }
    if ((baseFiles[key] || "") !== (targetFiles[key] || "")) {
      changed += 1;
    }
  });
  baseKeys.forEach((key) => {
    if (!targetKeys.has(key)) removed += 1;
  });

  return {
    added,
    removed,
    changed,
    dependencyChanged: JSON.stringify(baseCommit.dependencies || []) !== JSON.stringify(targetCommit.dependencies || []),
  };
}

export function buildFileTree(filePaths: string[], folderPaths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const folderMap = new Map<string, FileTreeNode>();
  const ensureFolder = (folderPath: string) => {
    const clean = normalizePath(folderPath);
    if (!clean) return;
    const parts = clean.split("/").filter(Boolean);
    let level = root;
    let currentPath = "";
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = { name: part, path: currentPath, type: "folder", children: [] };
        folderMap.set(currentPath, folder);
        level.push(folder);
      }
      level = folder.children ?? [];
    }
  };

  for (const folderPath of folderPaths) ensureFolder(folderPath);

  for (const rawPath of filePaths) {
    const clean = normalizePath(rawPath);
    if (!clean) continue;
    parentFolders(clean).forEach(ensureFolder);
    const parts = clean.split("/").filter(Boolean);
    const fileName = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const parentNode = parentPath ? folderMap.get(parentPath) : null;
    const level = parentNode?.children ?? root;
    if (!level.find((node) => node.type === "file" && node.path === clean)) {
      level.push({ name: fileName, path: clean, type: "file" });
    }
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => (a.type !== b.type ? (a.type === "folder" ? -1 : 1) : a.name.localeCompare(b.name)));
    for (const node of nodes) if (node.children) sortNodes(node.children);
  };
  sortNodes(root);
  return root;
}

