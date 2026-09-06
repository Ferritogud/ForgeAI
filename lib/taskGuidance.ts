export interface TaskGuidance {
  summary: string;
  steps: string[];
}

/**
 * Keyword-based fallback guidance for when no API key is configured — same
 * philosophy as mockGenerator.ts/chatGenerator.ts: not smart, just not blank.
 */
const KEYWORD_GUIDANCE: { keywords: string[]; summary: string; steps: string[] }[] = [
  {
    keywords: ["research", "look into", "learn about", "study", "read"],
    summary: "Spend a focused block finding a few reliable sources, then note what's actually useful.",
    steps: [
      "Spend 15-20 focused minutes searching for 2-3 reliable sources on this",
      "Take short notes on whatever seems most directly useful",
      "Write down any open questions you still have afterward",
    ],
  },
  {
    keywords: ["write", "draft", "script", "lyrics"],
    summary: "Get a rough first pass down without editing, then tighten the weakest section.",
    steps: [
      "Block out time with no distractions before starting",
      "Write a rough first pass without editing — get the ideas down first",
      "Read it back once and tighten the weakest section",
    ],
  },
  {
    keywords: ["build", "assemble", "construct", "cut", "sew", "make", "craft"],
    summary: "Gather everything you need up front, then work in small, checked stages.",
    steps: [
      "Gather every material and tool you'll need before starting",
      "Do a rough/dry-fit version first if the task allows it",
      "Work in small stages, checking your work after each one",
    ],
  },
  {
    keywords: ["test", "measure", "practice", "run", "rehearse", "drill", "train"],
    summary: "Run it under realistic conditions a few times and track what actually went wrong.",
    steps: [
      "Set up conditions as close to the real thing as practical",
      "Do at least 2-3 attempts, not just one, to see real consistency",
      "Write down what went wrong so you can fix it next time",
    ],
  },
  {
    keywords: ["design", "sketch", "plan", "outline"],
    summary: "Rough it out on paper first, within your real constraints, before committing to details.",
    steps: [
      "Rough it out on paper first before committing to details",
      "List the constraints you have to work within",
      "Get a second opinion if you can before finalizing",
    ],
  },
  {
    keywords: ["review", "check", "debrief", "analyze", "evaluate"],
    summary: "Compare the result against what you expected and update your plan based on the gap.",
    steps: [
      "Compare the actual result against what you expected going in",
      "Note the single biggest thing to improve next time",
      "Update your plan or notes based on what you found",
    ],
  },
];

const DEFAULT_GUIDANCE: TaskGuidance = {
  summary: "Break this into the smallest first action you can take right now, and just start there.",
  steps: [
    "Break this into the smallest first action you can take right now",
    "Set a specific time block to work on it",
    "Do that first step, then reassess what's next",
  ],
};

export function generateMockTaskGuidance(taskText: string): TaskGuidance {
  const t = taskText.toLowerCase();
  const match = KEYWORD_GUIDANCE.find((g) => g.keywords.some((k) => t.includes(k)));
  return match ? { summary: match.summary, steps: match.steps } : DEFAULT_GUIDANCE;
}
