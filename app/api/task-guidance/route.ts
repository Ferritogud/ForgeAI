import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockTaskGuidance } from "@/lib/taskGuidance";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

/** Same defensive parsing pattern as generate-roadmap: strip stray code fences before parsing. */
function parseGuidanceJson(text: string): { summary: string; steps: string[] } {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const steps = parsed.steps;
  const summary = parsed.summary;
  if (!Array.isArray(steps)) throw new Error("Guidance response wasn't a list of steps");
  if (typeof summary !== "string" || !summary.trim()) throw new Error("Guidance response was missing a summary");
  return { summary, steps: steps.map(String) };
}

async function generateWithClaude(goal: string, milestoneTitle: string, taskText: string, apiKey: string) {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You're helping someone actually DO one specific task inside a larger plan. Give
concise, practical, step-by-step guidance — specific to what this task and project are really
about, not generic advice like "do some research" or "work hard."

Overall goal: "${goal}"
Milestone this task belongs to: "${milestoneTitle}"
Task: "${taskText}"

Return ONLY valid JSON, no prose, no markdown fences:
{ "summary": string, "steps": [string, string, ...] }

"summary" is ONE sentence capturing the core approach — this is shown first, by itself, so it has
to stand alone and actually be useful, not a vague teaser like "here's how to get started."

"steps" is 3-6 steps, each 1-2 short sentences max, specific and actionable given the actual task
above — not a paragraph. Each array item is already going to be displayed as one numbered list
item, so don't add your own "1." or "-" inside the string. You can use **bold** on a key term or
number if it helps scannability, but don't overdo it.`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const { summary, steps } = parseGuidanceJson(text);
  return {
    summary,
    steps,
    usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

export async function POST(req: NextRequest) {
  const { goal, milestoneTitle, taskText } = await req.json();

  if (!taskText || typeof taskText !== "string" || !taskText.trim()) {
    return NextResponse.json({ error: "taskText is required" }, { status: 400 });
  }

  const key = resolveApiKey();

  if (key && canUseServerKey()) {
    try {
      const result = await generateWithClaude(
        typeof goal === "string" ? goal : "",
        typeof milestoneTitle === "string" ? milestoneTitle : "",
        taskText,
        key
      );
      if (result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The Anthropic API request failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // No key configured — this is the intentional demo-data path.
  const delay = 400 + Math.random() * 400;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return NextResponse.json(generateMockTaskGuidance(taskText));
}
