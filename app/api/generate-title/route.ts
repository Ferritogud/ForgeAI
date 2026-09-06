import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockTitle } from "@/lib/titles";

async function generateWithClaude(goal: string, apiKey: string): Promise<string | null> {
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
  return cleaned || null;
}

export async function POST(req: NextRequest) {
  const { goal, apiKey } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  const key = typeof apiKey === "string" ? apiKey.trim() : "";

  if (key) {
    try {
      const title = await generateWithClaude(goal, key);
      if (title) return NextResponse.json({ title });
    } catch {
      // Title generation is cosmetic, not a core feature like plan
      // generation/chat — fall through to the local heuristic instead of
      // blocking project creation or surfacing an error banner over this.
    }
  }

  return NextResponse.json({ title: generateMockTitle(goal) });
}
