import type { MlbbDraftAgent } from "@shared/mobile-legends/types";
import { fetchJson } from "./client";

export type MlbbDraftAgentResponse = MlbbDraftAgent;

export async function fetchMlbbDraftAgent(baseUrl: string): Promise<MlbbDraftAgentResponse> {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return fetchJson<MlbbDraftAgentResponse>(`${normalizedBase}/api/mlbb-draft-agent`);
}