import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockRoadmap } from "@/lib/mockGenerator";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

interface MilestoneSummary {
  title: string;
  taskTexts: string[];
}

/** Same defensive fence-stripping pattern as the other generation routes. */
function parseMilestoneJson(text: string): { title: string; tasks: string[] } {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.title !== "string" || !Array.isArray(parsed.tasks)) {
    throw new Error("Regenerated milestone response wasn't the expected shape");
  }
  return { title: parsed.title, tasks: parsed.tasks.map(String) };
}

async function generateWithClaude(
  goal: string,
  milestones: MilestoneSummary[],
  targetIndex: number,
  feedback: string,
  enrich: boolean,
  apiKey: string
) {
  const anthropic = new Anthropic({ apiKey });

  const sequence = milestones
    .map(
      (m, i) =>
        `${i + 1}. "${m.title}"${i === targetIndex ? "  <-- REGENERATE THIS ONE" : ""}\n   Tasks: ${m.taskTexts.join("; ")}`
    )
    .join("\n");

  const instructions = enrich
    ? `The user wants MORE DEPTH on this milestone specifically, not a replacement — they're moving
faster than expected and want a bigger challenge here. Keep every one of its existing tasks
listed above, worded the same, and ADD 2-3 new, meaningfully more advanced/challenging tasks
that build on top of what's already there. Return the full task list (old + new).`
    : `The user wants THIS milestone replaced with a genuinely different, better version — not a
reworded copy of the same tasks. Reconsider its title and tasks from scratch given their
feedback below.`;

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `You're refining ONE milestone inside an existing execution plan. Only this milestone
changes — every other milestone stays exactly as it is — so the new version must still fit
logically in sequence with its neighbors (don't duplicate what an earlier milestone already
covers, and don't assume something a later milestone is responsible for).

Overall goal: "${goal}"

Full milestone sequence, in order:
${sequence}

${instructions}

User's feedback on milestone ${targetIndex + 1}: "${feedback || "No specific feedback given — just make it meaningfully better/different."}"

Return ONLY valid JSON, no prose, no markdown fences:
{ "title": string, "tasks": [string, string, ...] }

2-5 tasks (or the existing count + 2-3 more if enriching), each a single clear action item
starting with a verb, under about 15-20 words, one concrete action per task — same rules as
the rest of this app's tasks.`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const { title, tasks } = parseMilestoneJson(text);
  return { title, tasks, usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens } };
}

export async function POST(req: NextRequest) {
  const { goal, milestones, targetIndex, feedback, enrich } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }
  if (!Array.isArray(milestones) || typeof targetIndex !== "number" || !milestones[targetIndex]) {
    return NextResponse.json({ error: "milestones and a valid targetIndex are required" }, { status: 400 });
  }

  const key = resolveApiKey();
  const feedbackText = typeof feedback === "string" ? feedback.trim() : "";
  const isEnrich = enrich === true;

  if (key && canUseServerKey()) {
    try {
      const result = await generateWithClaude(goal, milestones, targetIndex, feedbackText, isEnrich, key);
      if (result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The Anthropic API request failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // No key configured — demo-data path. Pull a different milestone's worth of
  // mock tasks (from the same category-matched template) so it's at least
  // visibly different from what was there, rather than a no-op.
  const delay = 700 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const mockPlan = generateMockRoadmap(goal);
  const replacement = mockPlan.milestones[targetIndex % mockPlan.milestones.length];
  const currentTitle = milestones[targetIndex].title;
  const tasks = (replacement.tasks ?? []).map((t) => (typeof t === "string" ? t : t.text ?? ""));

  return NextResponse.json({
    title: isEnrich ? currentTitle : replacement.title ?? currentTitle,
    tasks: isEnrich ? [...milestones[targetIndex].taskTexts, "Take on one noticeably harder stretch task here"] : tasks,
  });
}
