import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateMockChatReply } from "@/lib/chatGenerator";
import { AI_MODEL } from "@/lib/ai";
import { Project } from "@/lib/types";
import { computeProjection } from "@/lib/projections";
import { canUseServerKey, recordServerUsage, resolveApiKey } from "@/lib/serverKey";

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

type ProjectContext = Pick<
  Project,
  "goal" | "milestones" | "createdAt" | "deadline" | "lastActiveDate" | "streakCount"
>;

const DAY_MS = 24 * 60 * 60 * 1000;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "mark_task_complete",
    description:
      "Call this when the user's message clearly indicates they finished a specific task from the task list in the system prompt. Only call it for a task you can confidently match and that isn't already marked done — for vague progress updates, questions, or ambiguous messages, just reply normally instead. If their message describes finishing MULTIPLE distinct tasks (e.g. \"I finished the research and the sketch\"), call this tool once per task in the same turn — don't just pick one and ignore the rest.",
    input_schema: {
      type: "object",
      properties: {
        milestoneIndex: { type: "integer", description: "Index of the milestone in the milestones list." },
        taskIndex: { type: "integer", description: "Index of the task within that milestone's task list." },
      },
      required: ["milestoneIndex", "taskIndex"],
    },
  },
];

function buildSystemPrompt(project: ProjectContext): string {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length;
  const percent = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;
  const projection = computeProjection(project, percent);

  const daysSinceActive = project.lastActiveDate
    ? Math.floor((Date.now() - new Date(project.lastActiveDate).getTime()) / DAY_MS)
    : null;

  const taskList = project.milestones
    .map((m, mi) =>
      m.tasks
        .map((t, ti) => `[${mi},${ti}]${t.completed ? " (done)" : ""} "${t.text}" — milestone "${m.title}"`)
        .join("\n")
    )
    .join("\n");

  const signals = [
    `Pace: ${projection.trend}${projection.trend !== "unknown" && projection.trend !== "complete" ? ` (projected finish ${projection.label})` : ""}.`,
    daysSinceActive !== null && daysSinceActive >= 3 ? `Hasn't touched this project in ${daysSinceActive} days.` : null,
    project.streakCount >= 3 ? `Currently on a ${project.streakCount}-day activity streak.` : null,
    project.deadline ? `Deadline: ${project.deadline}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return `You are ForgeAI's assistant for a single project — think of yourself as a knowledgeable
collaborator checking in, not a logging bot. Answer only using the data below; you are not a
general-purpose assistant. Keep responses short — 2-4 sentences is typical, this is a chat
reply, not an essay.

Light markdown is fine and rendered properly: use **bold** sparingly for a key term, and if
you're listing more than one or two things (e.g. several tasks the user mentioned finishing,
or several suggestions), use a short bullet list with lines starting in "- " rather than
cramming them into one run-on sentence. Don't use markdown for a single short answer that
doesn't need it — plain sentences are fine and often better.

When the user asks a direct question, lead with a direct, concrete answer in the very first
sentence — even if the plan's data model doesn't literally specify it, give your best concrete
answer anyway (a number, a range, a name) rather than opening with what the data doesn't contain.
Reasoning grounded in the project's real data (deadline, pace, projection) should support that
answer afterward, not precede it as a disclaimer. E.g. for "how many hours daily?", start with
something like "About 1-2 hours on lighter days, 3-4 on full practice-test days" and only then,
if useful, add "you're ahead of pace, so there's some flexibility there" — never open with "the
plan doesn't specify daily hours, it's structured by weekly milestones instead."

You have two jobs, and they're not mutually exclusive:
1. Answer whatever the user actually asked, and detect task completions via mark_task_complete
   when they clearly say they finished something.
2. When it's genuinely warranted by the signals below — not every message, only when there's
   something real to say — offer a brief, specific observation grounded in the actual data. E.g.
   if they're well ahead of pace, suggest pulling a future milestone forward; if they haven't
   been active in several days, ask what's blocking them (without guilt-tripping); if a deadline
   is close and pace is behind, say so plainly. Never invent a stat — only reference the signals
   given. Skip this entirely if nothing stands out; a plain answer is better than a forced
   observation.

Goal: "${project.goal}"
Progress: ${doneCount}/${allTasks.length} tasks complete (${Math.round(percent)}%).
Signals: ${signals || "None notable."}
Milestones:
${project.milestones
  .map((m, i) => `${i + 1}. ${m.title} (Week ${m.weekLabel}) — ${m.tasks.filter((t) => t.completed).length}/${m.tasks.length} done`)
  .join("\n")}

Tasks, indexed as [milestoneIndex,taskIndex] for use with mark_task_complete:
${taskList}`;
}

interface TaskCompletion {
  milestoneIndex: number;
  taskIndex: number;
}

/**
 * Computed from real project state, not the model's own words — the model
 * only supplies which task(s), never the numbers. A single completion stays
 * a short confirmation sentence; multiple completions render as a markdown
 * bullet list so the UI's list rendering actually gets exercised (this is
 * the exact "I finished X and Y" case that previously always collapsed to
 * one task and one plain sentence, no matter how many things were done).
 */
function buildCompletionReply(project: ProjectContext, completions: TaskCompletion[]): string {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length + completions.length;
  const total = allTasks.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (completions.length === 1) {
    const { milestoneIndex, taskIndex } = completions[0];
    const milestone = project.milestones[milestoneIndex];
    const task = milestone.tasks[taskIndex];
    return `Marked "${task.text}" complete under "${milestone.title}". You're now at ${percent}% (${doneCount}/${total} tasks).`;
  }

  const lines = completions.map(({ milestoneIndex, taskIndex }) => {
    const milestone = project.milestones[milestoneIndex];
    const task = milestone.tasks[taskIndex];
    return `- Marked **"${task.text}"** complete (${milestone.title})`;
  });

  return `${lines.join("\n")}\n\nYou're now at ${percent}% (${doneCount}/${total} tasks).`;
}

interface ClaudeChatResult {
  reply: string;
  actions?: TaskCompletion[];
  usage: { inputTokens: number; outputTokens: number };
}

async function generateWithClaude(
  project: ProjectContext,
  message: string,
  history: HistoryTurn[],
  apiKey: string
): Promise<ClaudeChatResult> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system: buildSystemPrompt(project),
    tools: TOOLS,
    messages: [...history, { role: "user", content: message }],
  });

  const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };

  const toolUses = response.content.filter(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === "mark_task_complete"
  );

  // Claude picks the task(s); we validate each against real state before
  // trusting it — an out-of-range or already-completed index is dropped
  // rather than silently doing nothing, and a duplicate (same task called
  // twice) is de-duped rather than double-completing.
  const seen = new Set<string>();
  const completions: TaskCompletion[] = [];
  for (const toolUse of toolUses) {
    const { milestoneIndex, taskIndex } = toolUse.input as { milestoneIndex: number; taskIndex: number };
    const key = `${milestoneIndex}-${taskIndex}`;
    if (seen.has(key)) continue;
    const milestone = project.milestones[milestoneIndex];
    const task = milestone?.tasks[taskIndex];
    if (milestone && task && !task.completed) {
      completions.push({ milestoneIndex, taskIndex });
      seen.add(key);
    }
  }

  if (completions.length > 0) {
    return {
      reply: buildCompletionReply(project, completions),
      actions: completions,
      usage,
    };
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { reply: text || "I didn't quite catch that — could you rephrase?", usage };
}

export async function POST(req: NextRequest) {
  const { project, message, history, apiKey } = await req.json();

  if (!project || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "project and message are required" }, { status: 400 });
  }

  const { key, usesServerKey } = resolveApiKey(apiKey);

  if (key && (!usesServerKey || canUseServerKey())) {
    try {
      const result = await generateWithClaude(project, message, history ?? [], key);
      if (usesServerKey && result.usage) recordServerUsage(result.usage.inputTokens + result.usage.outputTokens);
      return NextResponse.json(result);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "The Anthropic API request failed.";
      return NextResponse.json({ error: messageText }, { status: 502 });
    }
  }

  // No key configured — this is the intentional demo-data path. The mock
  // has never been able to check tasks off (see chatGenerator.ts) — that
  // capability only exists on the real-API path above.
  const delay = 500 + Math.random() * 700;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const reply = generateMockChatReply(project, message);
  return NextResponse.json({ reply });
}
