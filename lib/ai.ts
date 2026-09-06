import { loadApiKey } from "./storage";
import { generateMockTitle } from "./titles";

/**
 * Single source of truth for "should this AI feature call the real Anthropic
 * API, or fall back to mock data?" — both plan generation (AppShell) and
 * chat (ChatPanel) must import this rather than each reading
 * localStorage/loadApiKey directly, so there's exactly one place that
 * decides what counts as "a real key."
 */
export function getApiKey(): string | null {
  const key = loadApiKey().trim();
  return key.length > 0 ? key : null;
}

/** Model used for both roadmap generation and chat — cheap/fast is the right tradeoff for both. */
export const AI_MODEL = "claude-haiku-4-5-20251001";

/**
 * Short auto-title for a new project, mirroring Claude's own conversation
 * auto-titling. Skips the network round-trip entirely in mock mode — no key
 * means there's nothing to call, so go straight to the local heuristic.
 */
export async function generateProjectTitle(goal: string): Promise<string> {
  const key = getApiKey();
  if (!key) return generateMockTitle(goal);

  try {
    const res = await fetch("/api/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, apiKey: key }),
    });
    const data = await res.json();
    return typeof data.title === "string" && data.title.trim() ? data.title.trim() : generateMockTitle(goal);
  } catch {
    return generateMockTitle(goal);
  }
}
