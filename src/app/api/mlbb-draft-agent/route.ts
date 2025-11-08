import { mlbbDraftAgent } from "@/app/data/mobile-legends-draft-agent";

export function GET() {
  const fileName = `mlbb-draft-agent-${mlbbDraftAgent.version}.json`;
  const body = JSON.stringify(mlbbDraftAgent, null, 2);

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
