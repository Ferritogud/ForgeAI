import { NextRequest, NextResponse } from "next/server";
import { generateMockRoadmap } from "@/lib/mockGenerator";

export async function POST(req: NextRequest) {
  const { goal } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  // Simulated "thinking" latency so the computing/scan animation has room to play.
  const delay = 1200 + Math.random() * 800;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // TODO: replace mock with real Claude API call once ANTHROPIC_API_KEY is configured.
  const roadmap = generateMockRoadmap(goal);

  return NextResponse.json({ milestones: roadmap.milestones });

  /* ---- Real Claude API call (ready to activate) ----

  import Anthropic from "@anthropic-ai/sdk";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are ForgeAI, a planning engine that turns a student's goal into a
concrete execution plan. Given the goal below, return ONLY valid JSON matching this
shape, no prose, no markdown fences:

{
  "milestones": [
    { "title": string, "dueWeek": number, "tasks": [{ "title": string, "done": false }] }
  ]
}

Generate 4-6 milestones with 2-4 tasks each. Goal: "${goal}"`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const roadmap = JSON.parse(text);
  return NextResponse.json(roadmap);

  ---------------------------------------------------- */
}
