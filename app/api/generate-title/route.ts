import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockTitle } from "@/lib/titles";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

async function generateWithClaude(goal: string, apiKey: string): Promise<{ title: string | null; usage: { inputTokens: number; outputTokens: number } }> {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 20,
    messages: [
      {
        role: "user",
        content: `Summarize the goal below as a short project title: 3-6 words, no period at the end,
no surrounding quotes. Return ONLY the title, nothing else.

Goal: "${goal}"`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  const cleaned = text.replace(/^["']|["']$/g, "").replace(/\.$/, "").trim();
  return {
    title: cleaned || null,
    usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

export async function POST(req: NextRequest) {
  const { goal, apiKey } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  const { key, usesServerKey } = resolveApiKey(apiKey);

  if (key && (!usesServerKey || canUseServerKey())) {
    try {
      const { title, usage } = await generateWithClaude(goal, key);
      if (usesServerKey) recordServerUsage(usage.inputTokens + usage.outputTokens);
      if (title) return NextResponse.json({ title });
    } catch {
      // Title generation is cosmetic, not a core feature like plan
      // generation/chat — fall through to the local heuristic instead of
      // blocking project creation or surfacing an error banner over this.
    }
  }

  return NextResponse.json({ title: generateMockTitle(goal) });
}
