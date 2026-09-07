import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "@/lib/ai";
import { generateMockSoundboardReply } from "@/lib/soundboardGenerator";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the Idea Soundboard inside ForgeAI — a thinking partner for someone who is
ideating on project ideas, before they've committed to a plan. This is a DIFFERENT job from the
main app's project assistant: you are not tracking tasks or milestones here, you're helping
someone think out loud about a raw idea.

Be a real soundboard, not a hype machine:
- Ask the question that actually matters for THIS idea (who has this problem, why now, what's
  the hardest part, what would make you drop it) — not a generic checklist.
- React genuinely. If something is vague, say so and ask for the specific version. If something
  is a real insight, say why it lands.
- Offer angles they might not have considered, and be willing to gently push back on a weak
  premise — validating everything isn't actually useful to someone trying to think clearly.
- This is a spoken/typed conversation, not an essay. Keep replies conversational and short —
  2-4 sentences, occasionally a short list if you're offering a few angles. Ask one question at
  a time, not three.
- You have no memory of their actual ForgeAI projects here — this is a separate space for raw
  ideas that haven't become a plan yet.`;

async function generateWithClaude(message: string, history: HistoryTurn[], apiKey: string) {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [...history, { role: "user", content: message }],
  });

  const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { reply: text || "I didn't quite catch that — could you rephrase?", usage };
}

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const key = resolveApiKey();
  const turns: HistoryTurn[] = Array.isArray(history)
    ? history.filter((h): h is HistoryTurn => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
    : [];

  if (key && canUseServerKey()) {
    try {
      const result = await generateWithClaude(message, turns, key);
      if (result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "The Anthropic API request failed.";
      return NextResponse.json({ error: messageText }, { status: 502 });
    }
  }

  const delay = 400 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return NextResponse.json({ reply: generateMockSoundboardReply(message) });
}
