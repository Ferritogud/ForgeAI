/**
 * Demo-mode fallback for the Idea Soundboard — same "not smart, just not
 * blank" philosophy as the other mock generators in this app, used when no
 * API key is configured.
 */
export function generateMockSoundboardReply(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("?")) {
    return "Good question to sit with. In demo mode I can't reason about it properly — add your Anthropic API key in Settings and I'll actually dig into this with you.";
  }
  if (m.length < 40) {
    return "That's a starting point — tell me a bit more about who this is for and what problem it solves, and I can help you push on it. (Demo mode: add an API key in Settings for real brainstorming.)";
  }
  return "I hear a real idea in there. The thing I'd want to stress-test is who actually has this problem badly enough to care — but I can only give generic prompts like this in demo mode. Add your Anthropic API key in Settings and I'll actually engage with the specifics.";
}
