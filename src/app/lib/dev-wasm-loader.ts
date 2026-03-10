import type { EngineInput } from "@/app/lib/dev-engine";

declare global {
  interface Window {
    codevampWasm?: {
      scoreProject: (data: EngineInput) => number;
    };
  }
}

let loaded = false;
let loading = false;
const wasmEnabled = process.env.NEXT_PUBLIC_DEV_WASM_ENABLED === "1";
const wasmModulePath = process.env.NEXT_PUBLIC_DEV_WASM_MODULE_PATH?.trim() || "/wasm/pkg/dev_engine.js";

export async function ensureDevWasmRuntime(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!wasmEnabled) return false;
  if (loaded && typeof window.codevampWasm?.scoreProject === "function") return true;
  if (loading) return false;
  loading = true;

  try {
    const mod = await import(/* webpackIgnore: true */ wasmModulePath);
    if (typeof mod?.score_project !== "function") return false;
    window.codevampWasm = {
      scoreProject(data: EngineInput): number {
        return Number(mod.score_project(JSON.stringify(data)));
      },
    };
    loaded = true;
    return true;
  } catch {
    return false;
  } finally {
    loading = false;
  }
}
