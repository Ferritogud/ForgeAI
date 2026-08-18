import { Roadmap } from "./types";

function tasks(titles: string[]): { title: string; done: boolean }[] {
  return titles.map((title) => ({ title, done: false }));
}

const STUDY_PLAN: Roadmap = {
  milestones: [
    {
      title: "Diagnose Your Baseline",
      dueWeek: 1,
      tasks: tasks([
        "Take a full-length diagnostic practice test",
        "Score it and log results by section/topic",
        "Identify your 3 weakest topic areas",
      ]),
    },
    {
      title: "Master Core Concepts",
      dueWeek: 2,
      tasks: tasks([
        "Review foundational content for weak topics",
        "Work through targeted practice sets",
        "Build a formula / rules cheat sheet",
      ]),
    },
    {
      title: "Timed Section Practice",
      dueWeek: 3,
      tasks: tasks([
        "Complete 3 timed section drills",
        "Track pacing per question",
        "Redo every missed question untimed",
      ]),
    },
    {
      title: "Weak-Area Drilling",
      dueWeek: 4,
      tasks: tasks([
        "Run focused drills on remaining gaps",
        "Take a second diagnostic to measure gains",
        "Update your weak-topic list",
      ]),
    },
    {
      title: "Full-Length Simulations",
      dueWeek: 5,
      tasks: tasks([
        "Take 2 full timed practice exams",
        "Simulate real test-day conditions",
        "Debrief mistakes within 24 hours",
      ]),
    },
    {
      title: "Final Review & Confidence Check",
      dueWeek: 6,
      tasks: tasks([
        "Light review of formula sheet & notes",
        "One final light-touch practice set",
        "Prep test-day logistics (materials, sleep, route)",
      ]),
    },
  ],
};

const CONTENT_PLAN: Roadmap = {
  milestones: [
    {
      title: "Define Your Niche & Audience",
      dueWeek: 1,
      tasks: tasks([
        "Write a one-line channel positioning statement",
        "Research 5 comparable creators",
        "Define your ideal viewer persona",
      ]),
    },
    {
      title: "Brand & Channel Setup",
      dueWeek: 1,
      tasks: tasks([
        "Design channel art, logo, and thumbnail template",
        "Write channel description & trailer script",
        "Set up upload schedule and content calendar",
      ]),
    },
    {
      title: "Build a Content Pipeline",
      dueWeek: 2,
      tasks: tasks([
        "Batch-script 5 video outlines",
        "Film first batch of footage",
        "Set up a repeatable edit workflow",
      ]),
    },
    {
      title: "Launch First 5 Videos",
      dueWeek: 3,
      tasks: tasks([
        "Publish videos on a consistent cadence",
        "Optimize titles, thumbnails, and descriptions",
        "Cross-post clips to short-form platforms",
      ]),
    },
    {
      title: "Grow & Engage Your Community",
      dueWeek: 5,
      tasks: tasks([
        "Reply to every comment in the first 48 hours",
        "Run one community poll or Q&A",
        "Collaborate with one creator in your niche",
      ]),
    },
    {
      title: "Analyze & Iterate",
      dueWeek: 6,
      tasks: tasks([
        "Review analytics: retention & CTR by video",
        "Double down on your best-performing format",
        "Set goals for next 90 days",
      ]),
    },
  ],
};

const GENERIC_PLAN: Roadmap = {
  milestones: [
    {
      title: "Define Scope & Success Metrics",
      dueWeek: 1,
      tasks: tasks([
        "Write a one-paragraph problem statement",
        "Define 3 measurable success criteria",
        "List key constraints (time, budget, skills)",
      ]),
    },
    {
      title: "Research & Planning",
      dueWeek: 1,
      tasks: tasks([
        "Research 3 existing approaches or competitors",
        "Sketch the core approach or architecture",
        "List the riskiest unknowns to resolve first",
      ]),
    },
    {
      title: "Build the Core Version",
      dueWeek: 3,
      tasks: tasks([
        "Build the smallest version that proves the idea",
        "Cut anything not essential to the core loop",
        "Get it into a usable/demoable state",
      ]),
    },
    {
      title: "Test & Iterate",
      dueWeek: 4,
      tasks: tasks([
        "Get feedback from 3-5 real people",
        "Fix the top 3 issues raised",
        "Re-test the riskiest assumption",
      ]),
    },
    {
      title: "Polish & Prepare to Share",
      dueWeek: 5,
      tasks: tasks([
        "Tighten the experience end-to-end",
        "Prepare a walkthrough or demo script",
        "Fix any remaining rough edges",
      ]),
    },
    {
      title: "Launch & Gather Feedback",
      dueWeek: 6,
      tasks: tasks([
        "Share it with your target audience",
        "Collect structured feedback",
        "Plan the next iteration based on results",
      ]),
    },
  ],
};

const STUDY_KEYWORDS = ["exam", "test prep", "test", "sat", "act", "study", "quiz", "gre", "gmat", "final", "midterm"];
const CONTENT_KEYWORDS = ["channel", "youtube", "content", "video", "podcast", "tiktok", "influencer", "audience", "subscriber"];

export function generateMockRoadmap(goal: string): Roadmap {
  const g = goal.toLowerCase();

  if (STUDY_KEYWORDS.some((k) => g.includes(k))) {
    return STUDY_PLAN;
  }
  if (CONTENT_KEYWORDS.some((k) => g.includes(k))) {
    return CONTENT_PLAN;
  }
  return GENERIC_PLAN;
}
