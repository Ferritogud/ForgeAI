import { RawTask, Roadmap } from "./types";

function tasks(titles: string[]): RawTask[] {
  return titles.map((text) => ({ text }));
}

const STUDY_PLAN: Roadmap = {
  milestones: [
    {
      title: "Diagnose Your Baseline",
      weekLabel: 1,
      tasks: tasks([
        "Take a full-length diagnostic practice test",
        "Score it and log results by section/topic",
        "Identify your 3 weakest topic areas",
      ]),
    },
    {
      title: "Master Core Concepts",
      weekLabel: 2,
      tasks: tasks([
        "Review foundational content for weak topics",
        "Work through targeted practice sets",
        "Build a formula / rules cheat sheet",
      ]),
    },
    {
      title: "Timed Section Practice",
      weekLabel: 3,
      tasks: tasks([
        "Complete 3 timed section drills",
        "Track pacing per question",
        "Redo every missed question untimed",
      ]),
    },
    {
      title: "Weak-Area Drilling",
      weekLabel: 4,
      tasks: tasks([
        "Run focused drills on remaining gaps",
        "Take a second diagnostic to measure gains",
        "Update your weak-topic list",
      ]),
    },
    {
      title: "Full-Length Simulations",
      weekLabel: 5,
      tasks: tasks([
        "Take 2 full timed practice exams",
        "Simulate real test-day conditions",
        "Debrief mistakes within 24 hours",
      ]),
    },
    {
      title: "Final Review & Confidence Check",
      weekLabel: 6,
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
      weekLabel: 1,
      tasks: tasks([
        "Write a one-line channel positioning statement",
        "Research 5 comparable creators",
        "Define your ideal viewer persona",
      ]),
    },
    {
      title: "Brand & Channel Setup",
      weekLabel: 1,
      tasks: tasks([
        "Design channel art, logo, and thumbnail template",
        "Write channel description & trailer script",
        "Set up upload schedule and content calendar",
      ]),
    },
    {
      title: "Build a Content Pipeline",
      weekLabel: 2,
      tasks: tasks([
        "Batch-script 5 video outlines",
        "Film first batch of footage",
        "Set up a repeatable edit workflow",
      ]),
    },
    {
      title: "Launch First 5 Videos",
      weekLabel: 3,
      tasks: tasks([
        "Publish videos on a consistent cadence",
        "Optimize titles, thumbnails, and descriptions",
        "Cross-post clips to short-form platforms",
      ]),
    },
    {
      title: "Grow & Engage Your Community",
      weekLabel: 5,
      tasks: tasks([
        "Reply to every comment in the first 48 hours",
        "Run one community poll or Q&A",
        "Collaborate with one creator in your niche",
      ]),
    },
    {
      title: "Analyze & Iterate",
      weekLabel: 6,
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
      weekLabel: 1,
      tasks: tasks([
        "Write a one-paragraph problem statement",
        "Define 3 measurable success criteria",
        "List key constraints (time, budget, skills)",
      ]),
    },
    {
      title: "Research & Planning",
      weekLabel: 1,
      tasks: tasks([
        "Research 3 existing approaches or competitors",
        "Sketch the core approach or architecture",
        "List the riskiest unknowns to resolve first",
      ]),
    },
    {
      title: "Build the Core Version",
      weekLabel: 3,
      tasks: tasks([
        "Build the smallest version that proves the idea",
        "Cut anything not essential to the core loop",
        "Get it into a usable/demoable state",
      ]),
    },
    {
      title: "Test & Iterate",
      weekLabel: 4,
      tasks: tasks([
        "Get feedback from 3-5 real people",
        "Fix the top 3 issues raised",
        "Re-test the riskiest assumption",
      ]),
    },
    {
      title: "Polish & Prepare to Share",
      weekLabel: 5,
      tasks: tasks([
        "Tighten the experience end-to-end",
        "Prepare a walkthrough or demo script",
        "Fix any remaining rough edges",
      ]),
    },
    {
      title: "Launch & Gather Feedback",
      weekLabel: 6,
      tasks: tasks([
        "Share it with your target audience",
        "Collect structured feedback",
        "Plan the next iteration based on results",
      ]),
    },
  ],
};

const FITNESS_PLAN: Roadmap = {
  milestones: [
    {
      title: "Baseline & Base Building",
      weekLabel: 1,
      tasks: tasks([
        "Time a baseline effort at your target distance/activity",
        "Note current weekly volume and easy pace",
        "Set 3 easy-effort sessions for this week",
      ]),
    },
    {
      title: "Build Volume Gradually",
      weekLabel: 3,
      tasks: tasks([
        "Increase weekly volume by ~10%",
        "Add one longer session on the weekend",
        "Add a mobility/strength session to prevent injury",
      ]),
    },
    {
      title: "Add Intensity",
      weekLabel: 5,
      tasks: tasks(["Introduce one interval/tempo session per week", "Practice race-pace efforts", "Prioritize sleep and recovery on hard-session days"]),
    },
    {
      title: "Taper & Race-Ready",
      weekLabel: 7,
      tasks: tasks([
        "Cut volume ~30-40% in the final week",
        "Do one short sharpening session at goal pace",
        "Plan logistics: gear, route/venue, day-of nutrition",
      ]),
    },
  ],
};

const COOKING_PLAN: Roadmap = {
  milestones: [
    {
      title: "Pick Your Signature Dishes",
      weekLabel: 1,
      tasks: tasks([
        "Choose 5 dishes spanning different techniques (not 5 variations of one)",
        "Read 2-3 recipes for each and note the hardest step",
        "Build a shopping list of any specialty ingredients/tools needed",
      ]),
    },
    {
      title: "Learn the Hard Techniques Solo",
      weekLabel: 2,
      tasks: tasks([
        "Practice the trickiest technique from each dish in isolation (e.g. knife cuts, sauce emulsion, dough)",
        "Redo any technique that failed the first time",
      ]),
    },
    {
      title: "Full Dish Run-Throughs",
      weekLabel: 4,
      tasks: tasks([
        "Cook each dish start-to-finish once, timing yourself",
        "Note what went wrong and adjust the recipe/notes",
      ]),
    },
    {
      title: "Refine for Consistency",
      weekLabel: 5,
      tasks: tasks(["Re-cook your 2 weakest dishes until repeatable", "Dial in plating for all 5 dishes"]),
    },
    {
      title: "Serve It",
      weekLabel: 6,
      tasks: tasks(["Cook the full set for real guests", "Collect honest feedback and note final tweaks"]),
    },
  ],
};

const BUILD_PLAN: Roadmap = {
  milestones: [
    {
      title: "Design & Materials",
      weekLabel: 1,
      tasks: tasks([
        "Sketch the piece with real dimensions",
        "Make a cut list and materials/hardware list",
        "Source or buy materials",
      ]),
    },
    {
      title: "Rough Cuts & Joinery Prep",
      weekLabel: 2,
      tasks: tasks(["Cut all pieces to size", "Cut joinery (dado/mortise/pocket holes, whatever the design calls for)", "Dry-fit before any glue"]),
    },
    {
      title: "Assembly",
      weekLabel: 3,
      tasks: tasks(["Glue up in stages, checking square as you go", "Let cure fully before moving on"]),
    },
    {
      title: "Finishing",
      weekLabel: 4,
      tasks: tasks(["Sand through grits", "Apply finish (stain/oil/poly) in thin coats", "Let cure and attach any hardware"]),
    },
  ],
};

const PERFORMANCE_PLAN: Roadmap = {
  milestones: [
    {
      title: "Nail Down the Material",
      weekLabel: 1,
      tasks: tasks(["Write/finalize the full piece", "Break it into memorizable sections"]),
    },
    {
      title: "Learn It Section by Section",
      weekLabel: 2,
      tasks: tasks(["Drill the hardest section first, slowly", "Chain sections together once each is solid"]),
    },
    {
      title: "Full Run-Throughs",
      weekLabel: 3,
      tasks: tasks(["Run the whole piece start to finish daily", "Record yourself and note the weakest 10 seconds"]),
    },
    {
      title: "Rehearse Under Real Conditions",
      weekLabel: 4,
      tasks: tasks(["Rehearse in the actual setting/costume/setup if possible", "Do at least one full run with an audience of one"]),
    },
    {
      title: "Performance-Ready",
      weekLabel: 5,
      tasks: tasks(["Final polish pass on the weakest section only", "Confirm all logistics for the actual day"]),
    },
  ],
};

const STUDY_KEYWORDS = ["exam", "test prep", "test", "sat", "act", "study", "quiz", "gre", "gmat", "final", "midterm"];
const CONTENT_KEYWORDS = ["channel", "youtube", "content", "video", "podcast", "tiktok", "influencer", "audience", "subscriber"];
const FITNESS_KEYWORDS = ["5k", "10k", "marathon", "race", "run", "triathlon", "gym", "lift", "strength", "workout", "fitness"];
const COOKING_KEYWORDS = ["cook", "recipe", "dish", "culinary", "bake", "chef", "kitchen", "meal"];
const BUILD_KEYWORDS = ["build", "woodworking", "carpentry", "furniture", "craft", "diy", "workshop project"];
const PERFORMANCE_KEYWORDS = ["rap", "song", "sing", "perform", "music", "instrument", "dance", "act", "audition", "recite", "memorize", "speech", "train my parrot", "train a parrot", "teach my parrot"];

export function generateMockRoadmap(goal: string): Roadmap {
  const g = goal.toLowerCase();

  if (PERFORMANCE_KEYWORDS.some((k) => g.includes(k))) return PERFORMANCE_PLAN;
  if (FITNESS_KEYWORDS.some((k) => g.includes(k))) return FITNESS_PLAN;
  if (COOKING_KEYWORDS.some((k) => g.includes(k))) return COOKING_PLAN;
  if (BUILD_KEYWORDS.some((k) => g.includes(k))) return BUILD_PLAN;
  if (STUDY_KEYWORDS.some((k) => g.includes(k))) return STUDY_PLAN;
  if (CONTENT_KEYWORDS.some((k) => g.includes(k))) return CONTENT_PLAN;
  return GENERIC_PLAN;
}
