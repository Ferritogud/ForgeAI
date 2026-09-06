import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateMockRoadmap } from "@/lib/mockGenerator";
import { AI_MODEL } from "@/lib/ai";
import { describeGoalContext, estimatedHoursPerWeek, GoalContext, hasGoalContext } from "@/lib/goalContext";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Claude frequently wraps JSON in ```json fences even when told not to —
 * strip them before parsing rather than letting that throw and get treated
 * as a hard failure.
 */
function parseRoadmapJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

interface QuestionAnswer {
  question: string;
  answer: string;
}

function buildAnswersBlock(answers: QuestionAnswer[]): string {
  if (answers.length === 0) return "";
  return `

The user answered these clarifying questions before generation — use their answers to shape
milestone count, pacing, and task difficulty; don't just note them and ignore them. Reference
the most decision-relevant answer briefly in your reasoning (e.g. "Since you mentioned only
having 3 hours a week, I've spread this over 8 weeks instead of 5"):

${answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}
`;
}

/**
 * Turns the structured intake fields + deadline into a concrete, computed
 * time budget (real weeks available, real total hours) rather than leaving
 * the model to eyeball pacing from vague ranges — this is what lets
 * "mathematically respect the time commitment and deadline" be an actual
 * constraint instead of a suggestion.
 */
function buildBudgetBlock(context: GoalContext | undefined, deadline: string | undefined): string {
  const hoursPerWeek = estimatedHoursPerWeek(context?.timeCommitment);
  const weeksAvailable = deadline
    ? Math.max(1, Math.round((new Date(`${deadline}T00:00:00`).getTime() - Date.now()) / (7 * DAY_MS)))
    : null;
  const totalHours = hoursPerWeek && weeksAvailable ? hoursPerWeek * weeksAvailable : null;

  if (!hasGoalContext(context) && !deadline) return "";

  const lines: string[] = [];
  if (hasGoalContext(context)) lines.push(describeGoalContext(context));
  if (weeksAvailable) lines.push(`Deadline is approximately ${weeksAvailable} week${weeksAvailable === 1 ? "" : "s"} from today.`);
  if (totalHours) lines.push(`That works out to roughly ${totalHours} total realistic working hours for this whole plan.`);

  return `

The user filled in some context before typing their goal: ${lines.join(" ")}
Your milestone count, task depth, and pacing (weekLabel spacing) must be mathematically
realistic against this real time budget — don't eyeball it. If a real number of weeks/hours
is given above, the last milestone's weekLabel should roughly match the weeks available, and
the total scope of tasks across all milestones should roughly fit within the total hours,
not assume more time or skill than what's stated.

In "reasoning", explicitly name the SPECIFIC inputs that shaped the plan by their actual
values — e.g. "Since you're a beginner with only 5-15 hrs/week and no prior CAD experience,
I front-loaded extra research time before fabrication" — not vague statements like "given
your constraints." If the goal's ambition doesn't realistically fit the stated experience
level, time commitment, and/or deadline (e.g. an advanced outcome requested by a self-described
beginner with under 5 hrs/week and a tight deadline), say so HONESTLY in "reasoning" — name the
tension directly — rather than silently generating a plan that pretends it's all realistic.`;
}

async function generateWithClaude(
  goal: string,
  answers: QuestionAnswer[],
  apiKey: string,
  context?: GoalContext,
  deadline?: string
) {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are ForgeAI, a planning engine that turns a goal into a concrete execution
plan. Your job is to genuinely THINK about what this specific goal requires — not apply
a fixed template to everything.

Before deciding on milestones, reason through it privately: what skills, resources, or
materials does this actually require? What order do things have to happen in because of
real dependencies (you can't rehearse a song that doesn't exist yet, you can't run a 10k
before you can run a 5k)? What's realistic given any timeframe implied by the goal? Do
NOT default to a generic "diagnose → learn → practice → review" structure unless that
genuinely fits — most goals don't. A parrot-training plan should not structurally resemble
an exam-prep plan, a couch-to-10k plan, or a woodworking plan. Let the number of
milestones (it does not have to be 6), their pacing, and their internal logic come from
the goal itself, not from a template.

If the goal is vague or underspecified, make reasonable, explicit assumptions rather than
falling back to something generic — and mention the key assumption in your reasoning.

The reasoning above is for YOUR thinking only — never put it, or any other prose, inside
the milestones/tasks structure itself. It belongs solely in the top-level "reasoning"
field described below, completely separate from the plan structure.

Output ONLY valid JSON matching this shape, no prose outside the JSON, no markdown fences:

{
  "reasoning": string,
  "milestones": [
    {
      "title": string,
      "weekLabel": number,
      "tasks": [
        { "text": string },
        { "text": string }
      ]
    }
  ]
}

Concrete worked example of one milestone (follow this exact structure — note every task is
an object with a "text" key, NEVER a bare string):

{ "title": "Build a rough prototype", "weekLabel": 1, "tasks": [
  { "text": "Gather materials: wood scraps, rope, hinges" },
  { "text": "Assemble a basic frame without worrying about precision" }
] }

This is wrong and will break the app — do not do this: "tasks": ["Gather materials", "Assemble a frame"]

"reasoning" is 1-2 sentences explaining WHY you structured it this way (e.g. "I've
structured this around training first, content creation second, and rehearsal last, since
the rap needs to exist before you can rehearse it") — not a restatement of the plan, the
actual reasoning behind its shape. Keep it short; it's shown to the user, not a scratchpad.

Milestones should have 2-5 tasks each, whatever fits the milestone's actual scope.

Each task's "text" must read like a single clear action item, not a run-on sentence: start
with a verb, stay under about 15-20 words, and describe one concrete action — not a bundle
of several things joined by "and." E.g. "Sketch a basic frame with labeled dimensions" is
good; "Research the topic thoroughly and take detailed notes and identify weak areas and
make a plan" is not — that's four tasks pretending to be one.
${buildAnswersBlock(answers)}${buildBudgetBlock(context, deadline)}
Goal: "${goal}"`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = parseRoadmapJson(text);
  return {
    ...parsed,
    usage: { inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens },
  };
}

export async function POST(req: NextRequest) {
  const { goal, apiKey, answers, context, deadline } = await req.json();

  if (!goal || typeof goal !== "string" || !goal.trim()) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  const key = typeof apiKey === "string" ? apiKey.trim() : "";
  const qa: QuestionAnswer[] = Array.isArray(answers)
    ? answers.filter(
        (a): a is QuestionAnswer =>
          a && typeof a.question === "string" && typeof a.answer === "string" && a.answer.trim().length > 0
      )
    : [];
  const goalContext: GoalContext | undefined = context ?? undefined;
  const resolvedDeadline: string | undefined = typeof deadline === "string" && deadline ? deadline : undefined;

  if (key) {
    try {
      const roadmap = await generateWithClaude(goal, qa, key, goalContext, resolvedDeadline);
      return NextResponse.json(roadmap);
    } catch (err) {
      // A key was supplied and the real call was attempted — surface the
      // failure instead of quietly handing back mock data, which is exactly
      // what made a bad key/model/response indistinguishable from "no key"
      // in the first place.
      const message = err instanceof Error ? err.message : "The Anthropic API request failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // No key configured — this is the intentional demo-data path.
  const delay = 1200 + Math.random() * 800;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const roadmap = generateMockRoadmap(goal);
  return NextResponse.json({ milestones: roadmap.milestones, reasoning: buildMockReasoning(goalContext, resolvedDeadline) });
}

/** Same "cite the specific inputs, computed locally, no extra API call" approach as the real prompt above — just templated instead of model-written, since the mock path never calls the API at all. */
function buildMockReasoning(context: GoalContext | undefined, deadline: string | undefined): string | null {
  if (!hasGoalContext(context) && !deadline) return null;

  const bits: string[] = [];
  if (context?.experienceLevel) bits.push(`you're starting from a ${context.experienceLevel.toLowerCase()} level`);
  if (context?.timeCommitment) bits.push(`you have ${context.timeCommitment} available`);
  if (deadline) {
    const weeks = Math.max(1, Math.round((new Date(`${deadline}T00:00:00`).getTime() - Date.now()) / (7 * DAY_MS)));
    bits.push(`you're working with about ${weeks} week${weeks === 1 ? "" : "s"} until your deadline`);
  }
  if (bits.length === 0) return null;

  const clause = bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
  return `Since ${clause}, this plan's pacing is scaled to that reality rather than assuming more time or experience than you actually have.`;
}
