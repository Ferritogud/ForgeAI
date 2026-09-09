/** Shared "AI is responding" indicator — used anywhere a chat-style reply is in flight (ChatPanel, SoundboardPanel), so the app has exactly one loading pattern for this instead of static "Thinking…" text in some places and a spinner in others. */
export default function TypingIndicator() {
  return (
    <div className="self-start flex items-center gap-1 rounded-2xl px-4 py-3 bg-card-muted border border-line" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}
