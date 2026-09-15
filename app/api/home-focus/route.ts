import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

interface ProjectSummary {
  name: string;
  currentMilestone: string | null;
  pendingCount: number;
  slipped: boolean;
}

function buildMockMessage(projects: ProjectSummary[]): string {
  if (projects.length === 0) return "Create your first project to get started.";
  const slipped = projects.find((p) => p.slipped);
  if (slipped) return `${slipped.name} has slipped behind schedule — that's the one to pick up today.`;
  const busiest = [...projects].sort((a, b) => b.pendingCount - a.pendingCount)[0];
  return `Start with ${busiest.name}${busiest.currentMilestone ? ` — ${busiest.currentMilestone}` : ""} and knock out one task.`;
}

async function generateWithClaude(projects: ProjectSummary[], apiKey: string) {
  const anthropic = new Anthropic({ apiKey });

  const summary = projects
    .map(
      (p) =>
        `- "${p.name}"${p.currentMilestone ? ` — current phase: "${p.currentMilestone}"` : ""}, ${p.pendingCount} task(s) pending${p.slipped ? ", SLIPPED behind schedule" : ""}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 80,
    messages: [
      {
        role: "user",
        content: `You're a terse, encouraging productivity coach inside a planning app's home screen. A user has these active projects:

${summary}

Write ONE short sentence (max ~22 words) telling them what to focus on today and briefly why. Talk directly to them ("you"). No greeting, no fluff, no markdown, no quotes around it — just the sentence. Prioritize a slipped project if there is one.`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return {
    message: text || buildMockMessage(projects),
    usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`home-focus:${getClientIp(req)}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });
  }

  const { projects } = await req.json();
  const list: ProjectSummary[] = Array.isArray(projects) ? projects : [];

  const key = resolveApiKey();

  if (key && canUseServerKey()) {
    try {
      const result = await generateWithClaude(list, key);
      if (result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch {
      // Cosmetic feature, not core — fall through to the rule-based line
      // rather than surfacing an error banner on the home screen.
      return NextResponse.json({ message: buildMockMessage(list) });
    }
  }

  return NextResponse.json({ message: buildMockMessage(list) });
}
