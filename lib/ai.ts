import { generateMockTitle } from "./titles";

/** Model used for both roadmap generation and chat — cheap/fast is the right tradeoff for both. */
export const AI_MODEL = "claude-haiku-4-5-20251001";

/**
 * Short auto-title for a new project, mirroring Claude's own conversation
 * auto-titling. Falls back to the local heuristic if the request fails or
 * the shared server key is out of daily budget.
 */
export async function generateProjectTitle(goal: string): Promise<string> {
  try {
    const res = await fetch("/api/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const data = await res.json();
    return typeof data.title === "string" && data.title.trim() ? data.title.trim() : generateMockTitle(goal);
  } catch {
    return generateMockTitle(goal);
  }
}
