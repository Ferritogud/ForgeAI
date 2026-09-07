import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockQuestions } from "@/lib/questions";
import { describeGoalContext, GoalContext, hasGoalContext } from "@/lib/goalContext";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

function parseQuestionsJson(text: string): string[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(questions) || questions.length === 0) throw new Error("Questions response wasn't a usable list");
  return questions.map(String);
}

function buildContextBlock(context?: GoalContext): string {
  if (!hasGoalContext(context)) return "";
  return `

The user already filled in some structured fields before typing their goal: ${describeGoalContext(context)}
Do NOT ask about anything already covered by these fields (e.g. don't ask their experience level if it's
already given, don't ask about weekly time availability if it's already given) — that would waste one of
their 3-5 questions re-asking what you already know. Use the slot that question would have taken to go
DEEPER into domain-specific specifics instead (e.g. for a physical/building goal: tools/materials access
and safety concerns; for an academic goal: current baseline performance and biggest content gaps; for a
creative goal: audience/format and existing skill in the specific medium).`;
}

async function generateWithClaude(goal: string, apiKey: string, context?: GoalContext) {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `A user just typed this goal into a planning app: "${goal}"

Before generating their execution plan, you get to ask 3-5 short clarifying questions that
will genuinely change how you'd structure the plan — not generic filler that applies equally
to any goal. Think about what actually matters for THIS specific goal: realistic time
available, current skill/experience level, real constraints (budget, equipment, deadline),
and whatever else is likely to change the plan's shape or pacing. Pick whichever 3-5 questions
would most change how you'd plan this — don't default to the same list for every goal.

Each question should be answerable in one short sentence, not an essay prompt.
${buildContextBlock(context)}
Return ONLY valid JSON, no prose, no markdown fences:
{ "questions": [string, string, ...] }`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const questions = parseQuestionsJson(text);
  return { questions, usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens } };
}

export async function POST(req: NextRequest) {
  const { goal, context } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  const key = resolveApiKey();
  const goalContext: GoalContext | undefined = context ?? undefined;

  if (key && canUseServerKey()) {
    try {
      const result = await generateWithClaude(goal, key, goalContext);
      if (result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch {
      // Question generation is a nice-to-have layer on top of the core
      // generation flow, not the core paid action itself — if it fails, fall
      // back to generic questions rather than blocking or erroring out of
      // what's supposed to be a fast, low-friction step. Unlike plan
      // generation/chat, a bad key here shouldn't stop someone from planning.
      return NextResponse.json({ questions: generateMockQuestions(goalContext) });
    }
  }

  // No key configured — this is the intentional demo-data path.
  const delay = 300 + Math.random() * 300;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return NextResponse.json({ questions: generateMockQuestions(goalContext) });
}
