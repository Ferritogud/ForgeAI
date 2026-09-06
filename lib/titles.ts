const FILLER_PREFIXES = [
  /^i want to /i,
  /^i wanna /i,
  /^i need to /i,
  /^i'd like to /i,
  /^i would like to /i,
  /^my goal is to /i,
  /^my goal is /i,
  /^help me /i,
  /^i'm trying to /i,
  /^i am trying to /i,
  /^i'm going to /i,
];

/** Small connector words a title shouldn't trail off on ("...recite the"). */
const TRAILING_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "and",
  "or",
  "my",
  "your",
  "at",
  "by",
  "within",
  "during",
  "before",
  "after",
  "into",
  "from",
  "about",
]);

/** A trailing bare number ("...in 8", "...to 10,000") almost always means the word that gave it meaning ("weeks", "subscribers") got cut off. */
function isDanglingNumber(word: string): boolean {
  return /^[\d,]+\+?$/.test(word);
}

const MAX_TITLE_WORDS = 6;

/**
 * No-key fallback: strip a leading filler phrase, cut at the first clause
 * boundary, and take the first few words. Not smart summarization — just
 * meant to beat showing the raw truncated sentence, per the mock-mode
 * philosophy used elsewhere in this app (mockGenerator.ts, chatGenerator.ts).
 */
export function generateMockTitle(goal: string): string {
  let text = goal.trim();
  for (const pattern of FILLER_PREFIXES) {
    text = text.replace(pattern, "");
  }
  text = text.split(/[.,;]| but | so | and then /i)[0].trim();

  const words = text.split(/\s+/).filter(Boolean).slice(0, MAX_TITLE_WORDS);
  while (
    words.length > 1 &&
    (TRAILING_STOPWORDS.has(words[words.length - 1].toLowerCase()) || isDanglingNumber(words[words.length - 1]))
  ) {
    words.pop();
  }

  if (words.length === 0) return "Untitled Project";
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}
