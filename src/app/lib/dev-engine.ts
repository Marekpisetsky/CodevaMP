export type EngineInput = {
  title: string;
  summary: string;
  stack: string;
  hasRepo: boolean;
  hasDemo: boolean;
};

export function scoreProjectLocal(input: EngineInput): number {
  const wasmScore = tryWindowWasmScore(input);
  if (typeof wasmScore === "number") {
    return wasmScore;
  }
  return fallbackScore(input);
}

function tryWindowWasmScore(input: EngineInput): number | null {
  try {
    // Optional runtime hook: window.codevampWasm.scoreProject(input)
    if (typeof window === "undefined") return null;
    const runtime = (window as unknown as { codevampWasm?: { scoreProject?: (data: EngineInput) => number } })
      .codevampWasm;
    if (typeof runtime?.scoreProject !== "function") return null;
    const score = Number(runtime.scoreProject(input));
    if (!Number.isFinite(score)) return null;
    return clamp(Math.round(score), 0, 100);
  } catch {
    return null;
  }
}

function fallbackScore(input: EngineInput): number {
  let score = 22;
  score += Math.min(20, input.title.trim().length);
  score += Math.min(24, Math.floor(input.summary.trim().length / 3));
  score += Math.min(22, input.stack.split(/[,+/|]/g).filter((v) => v.trim().length > 1).length * 5);
  if (input.hasRepo) score += 6;
  if (input.hasDemo) score += 6;
  return clamp(score, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
