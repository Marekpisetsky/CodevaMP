import type { MlbbDraftAgent } from "@shared/mobile-legends/types";
import { fetchMlbbDraftAgent } from "@shared/api/mlbb-draft-agent";
import { getApiBaseUrl } from "../utils/environment";

export async function loadMlbbDraftAgent(): Promise<MlbbDraftAgent> {
  const baseUrl = getApiBaseUrl();
  return fetchMlbbDraftAgent(baseUrl);
}