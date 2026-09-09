"use client";

import { useEffect, useRef, useState } from "react";
import { Tier, TokenUsage } from "@/lib/types";
import { TOKEN_LIMITS, isTokenLimitReached } from "@/lib/tiers";
import MarkdownText from "./MarkdownText";
import TypingIndicator from "./TypingIndicator";

interface SoundboardMessage {
  role: "user" | "assistant";
  content: string;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3" fill={active ? "currentColor" : "none"} />
      <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2M5.5 14.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 1.5 9.2 5.3 13 6.5l-3.8 1.2L8 11.5 6.8 7.7 3 6.5l3.8-1.2L8 1.5Z" fill="currentColor" />
    </svg>
  );
}

interface SoundboardPanelProps {
  open: boolean;
  onClose: () => void;
  tier: Tier;
  usage: TokenUsage;
  onRecordTokens: (tokens: number) => void;
  onUpgrade: () => void;
}

// Web Speech API isn't in TS's DOM lib — narrow shape for what we actually use.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export default function SoundboardPanel({ open, onClose, tier, usage, onRecordTokens, onUpgrade }: SoundboardPanelProps) {
  const [messages, setMessages] = useState<SoundboardMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const limit = TOKEN_LIMITS[tier];
  const isUnlimited = limit === Infinity;
  const limitReached = isTokenLimitReached(tier, usage.tokensUsed);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, sending, open]);

  // Feature-detect the browser's built-in speech recognition (Chrome/Safari
  // ship it under a webkit prefix, Firefox doesn't support it at all) —
  // deliberately client-side/free rather than a paid transcription API,
  // since this is available to every pricing tier.
  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognitionCtor);
  }, []);

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending || limitReached) return;

    const userMessage: SoundboardMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const history = messages.slice(-8);
      const res = await fetch("/api/soundboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const reply = data.reply ?? "Something went wrong generating a reply.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      if (data.usage) onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-[120] h-screen w-full max-w-md flex flex-col
          border-l border-line bg-card
          transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-accent shrink-0">
              <SparkleIcon />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-accent">Available on every plan</p>
              <h2 className="text-xl font-bold text-ink-primary mt-1 truncate">Idea Soundboard</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ink-secondary hover:text-accent hover:bg-accent-soft transition-colors"
              aria-label="Close soundboard"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="divider shrink-0" />

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="eyebrow text-center mt-8 leading-relaxed">
              Talk through a raw project idea — type or use the mic. No project needed; this is just for
              thinking out loud.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "self-end bg-accent-soft border border-accent/30 text-ink-primary"
                  : "self-start bg-card-muted border border-line text-ink-secondary"
              }`}
            >
              {m.role === "assistant" ? <MarkdownText text={m.content} /> : <span className="leading-relaxed">{m.content}</span>}
            </div>
          ))}
          {sending && <TypingIndicator />}

          {error && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-xs text-warn leading-snug mt-1">
              Couldn&apos;t reach the Anthropic API: {error} — check your key in Settings, or leave it blank to use
              demo replies.
            </div>
          )}

          {limitReached && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 flex flex-col gap-2.5 mt-1">
              <p className="text-xs text-ink-secondary leading-snug">
                You&apos;ve used all your AI tokens this month — upgrade for more.
              </p>
              <button
                onClick={onUpgrade}
                className="self-start px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:brightness-110 transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-2 shrink-0">
          {!isUnlimited && (
            <p className="font-mono text-2xs text-ink-faint mb-2 text-center">
              Shared with your other AI usage — {usage.tokensUsed.toLocaleString()} / {limit.toLocaleString()} tokens
              this month
            </p>
          )}

          <div
            className={`flex items-end gap-2 rounded-2xl border bg-card-muted transition-colors px-3 py-2 ${
              limitReached ? "border-line opacity-60" : "border-line focus-within:border-accent"
            }`}
          >
            {voiceSupported && (
              <button
                onClick={toggleListening}
                disabled={limitReached}
                className={`shrink-0 p-2 rounded-xl transition-colors disabled:pointer-events-none ${
                  listening ? "text-warn bg-warn-soft" : "text-ink-faint hover:text-accent hover:bg-accent-soft"
                }`}
                aria-label={listening ? "Stop recording" : "Speak your idea"}
                title={listening ? "Stop recording" : "Speak your idea"}
              >
                <MicIcon active={listening} />
              </button>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={limitReached}
              placeholder={
                limitReached
                  ? "Monthly AI usage limit reached"
                  : listening
                    ? "Listening…"
                    : "What's the idea?"
              }
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none py-1.5 max-h-24 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending || limitReached}
              className="shrink-0 p-2 rounded-xl text-accent hover:bg-accent-soft disabled:text-ink-faint disabled:pointer-events-none transition-colors"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
