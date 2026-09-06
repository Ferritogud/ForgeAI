import { GoalCategory } from "./goalContext";

/**
 * Keyword-based category guesser for the initial goal textarea — deliberately
 * client-side/instant rather than an API call: this is a low-stakes cosmetic
 * nudge (the user can override it with one click), so spending a real request
 * and adding latency for it isn't worth it. Same "not smart, just not blank"
 * philosophy as lib/mockGenerator.ts's template matching, whose keyword lists
 * this reuses/adapts.
 */
const CATEGORY_KEYWORDS: { category: GoalCategory; keywords: string[] }[] = [
  {
    category: "Academic",
    keywords: [
      "exam", "test prep", "sat", "act", "gre", "gmat", "thesis", "dissertation", "study",
      "school", "course", "degree", "university", "college", "icfes", "midterm", "final exam",
      "class", "certification", "cpa", "bar exam", "quiz", "homework",
    ],
  },
  {
    category: "Fitness/Health",
    keywords: [
      "5k", "10k", "marathon", "triathlon", "run", "running", "gym", "lift", "strength",
      "workout", "fitness", "weight loss", "diet", "yoga", "muscle", "cardio", "training plan",
      "swim", "cycling",
    ],
  },
  {
    category: "Creative",
    keywords: [
      "youtube", "video", "podcast", "channel", "content creator", "write", "novel", "book",
      "song", "music", "album", "paint", "draw", "film", "photography", "design", "art",
      "perform", "audition", "recite", "memorize", "dance", "sing", "instrument", "lyrics",
    ],
  },
  {
    category: "Business/Career",
    keywords: [
      "startup", "business", "mvp", "launch my", "career", "job", "resume", "interview",
      "client", "revenue", "marketing", "sales", "freelance", "company", "product launch",
      "saas", "funding", "pitch deck", "promotion", "linkedin",
    ],
  },
  {
    category: "Personal Project",
    keywords: [
      "build", "woodworking", "carpentry", "furniture", "craft", "diy", "garden", "renovate",
      "cook", "recipe", "bake", "kitchen", "home", "parrot", "pet", "train my", "teach my",
      "3d print", "exoskeleton", "robot",
    ],
  },
];

/** Returns the best-guess category for a goal string, or null if nothing matched confidently enough to guess — a wrong "Other" default would be worse than no guess at all. */
export function detectCategory(goal: string): GoalCategory | null {
  const g = goal.toLowerCase();
  if (g.trim().length < 6) return null;
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => g.includes(k))) return category;
  }
  return null;
}
