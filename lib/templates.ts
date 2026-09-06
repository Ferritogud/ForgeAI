import { RawMilestone, RawTask } from "./types";

function tasks(titles: string[]): RawTask[] {
  return titles.map((text) => ({ text }));
}

export interface ProjectTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  goal: string;
  milestones: RawMilestone[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "exam-prep",
    label: "SAT / Exam Prep",
    description: "6-week structured study plan",
    icon: "📚",
    goal: "Score 1400+ on the SAT",
    milestones: [
      {
        title: "Diagnose Your Starting Point",
        weekLabel: 1,
        tasks: tasks([
          "Take a full-length practice exam under timed conditions",
          "Score it and break down results by section/topic",
          "Identify your top 3 weakest areas",
        ]),
      },
      {
        title: "Build Core Content Knowledge",
        weekLabel: 2,
        tasks: tasks([
          "Review foundational concepts for each weak area",
          "Work through targeted practice problem sets",
          "Create a formula / rules reference sheet",
        ]),
      },
      {
        title: "Timed Practice & Pacing",
        weekLabel: 3,
        tasks: tasks([
          "Complete 3 timed section drills",
          "Track time spent per question type",
          "Redo every missed question untimed to find the gap",
        ]),
      },
      {
        title: "Targeted Drilling",
        weekLabel: 4,
        tasks: tasks([
          "Run focused drills on remaining weak spots",
          "Take a second full practice exam to measure progress",
          "Update your weak-topic list based on new results",
        ]),
      },
      {
        title: "Full Simulation Runs",
        weekLabel: 5,
        tasks: tasks([
          "Take 2 full-length timed practice exams",
          "Simulate real test-day conditions (location, timing, breaks)",
          "Debrief every mistake within 24 hours",
        ]),
      },
      {
        title: "Final Review & Test Day Prep",
        weekLabel: 6,
        tasks: tasks([
          "Light review of your reference sheet and notes only",
          "One final light-touch practice set, no new material",
          "Confirm test-day logistics (ID, materials, route, sleep schedule)",
        ]),
      },
    ],
  },
  {
    id: "youtube-channel",
    label: "Launch a YouTube Channel",
    description: "6-week plan from idea to first videos",
    icon: "🎥",
    goal: "Launch my YouTube channel",
    milestones: [
      {
        title: "Define Your Niche & Audience",
        weekLabel: 1,
        tasks: tasks([
          "Write a one-sentence description of your channel's focus",
          "Research 5 channels in your niche and note what works",
          "Define your ideal viewer and what they want from your content",
        ]),
      },
      {
        title: "Set Up Your Channel",
        weekLabel: 2,
        tasks: tasks([
          "Create channel art, profile picture, and banner",
          "Write your channel description and about section",
          "Plan your upload schedule and content pillars",
        ]),
      },
      {
        title: "Plan Your First 5 Videos",
        weekLabel: 3,
        tasks: tasks([
          "Brainstorm and shortlist 10 video ideas",
          "Script or outline your first 5 videos",
          "Storyboard or shot-list your first video",
        ]),
      },
      {
        title: "Produce & Edit",
        weekLabel: 4,
        tasks: tasks([
          "Film your first 3 videos",
          "Edit and add titles / captions / thumbnails",
          "Get feedback from 2-3 people before publishing",
        ]),
      },
      {
        title: "Launch & Publish",
        weekLabel: 5,
        tasks: tasks([
          "Publish your first video and share it in relevant communities",
          "Publish videos 2 and 3 on a consistent schedule",
          "Set up basic analytics tracking (views, retention, CTR)",
        ]),
      },
      {
        title: "Learn & Iterate",
        weekLabel: 6,
        tasks: tasks([
          "Review analytics from your first videos",
          "Identify what retained viewers vs. what lost them",
          "Plan your next batch of videos based on what worked",
        ]),
      },
    ],
  },
  {
    id: "thesis-capstone",
    label: "Finish a Thesis / Capstone",
    description: "6-week plan from topic to submission",
    icon: "🎓",
    goal: "Finish my thesis / capstone project",
    milestones: [
      {
        title: "Define Topic & Scope",
        weekLabel: 1,
        tasks: tasks([
          "Write a one-paragraph problem statement and research question",
          "Get topic approval from your advisor/committee",
          "Define your scope and what's explicitly out of bounds",
        ]),
      },
      {
        title: "Literature Review",
        weekLabel: 2,
        tasks: tasks([
          "Collect 15-20 relevant sources",
          "Summarize key findings and identify gaps in existing research",
          "Write your literature review section draft",
        ]),
      },
      {
        title: "Research Design & Methodology",
        weekLabel: 3,
        tasks: tasks([
          "Define your methodology and data sources",
          "Write your methodology section",
          "Get sign-off from your advisor before proceeding",
        ]),
      },
      {
        title: "Data Collection / Core Work",
        weekLabel: 4,
        tasks: tasks([
          "Execute your core research, experiment, or build",
          "Keep a running log of findings and decisions",
          "Flag any deviations from the original plan early",
        ]),
      },
      {
        title: "Writing & Drafting",
        weekLabel: 5,
        tasks: tasks([
          "Write your results/findings section",
          "Write your discussion and conclusion sections",
          "Assemble a full first draft and send for advisor feedback",
        ]),
      },
      {
        title: "Revise & Submit",
        weekLabel: 6,
        tasks: tasks([
          "Incorporate advisor/committee feedback",
          "Proofread, format, and check citations",
          "Submit final version and prepare defense/presentation materials",
        ]),
      },
    ],
  },
];
