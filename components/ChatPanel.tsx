"use client";

import { useEffect, useRef, useState } from "react";
import { Attachment, ChatMessage, Project, Tier, TokenUsage } from "@/lib/types";
import { getApiKey } from "@/lib/ai";
import { TOKEN_LIMITS, isTokenLimitReached } from "@/lib/tiers";
import { fileToAttachment } from "@/lib/attachments";
import AttachmentList from "./AttachmentList";
import MarkdownText from "./MarkdownText";

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
function PaperclipIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M11.5 5.5 6.9 10.1a2 2 0 1 0 2.8 2.8l5-5a3.5 3.5 0 1 0-5-5l-5.2 5.2a5 5 0 0 0 7.1 7.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSendMessage: (projectId: string, message: ChatMessage) => void;
  onToggleTask: (milestoneIndex: number, taskIndex: number) => void;
  tier: Tier;
  usage: TokenUsage;
  onRecordTokens: (tokens: number) => void;
  onUpgrade: () => void;
}

export default function ChatPanel({
  open,
  onClose,
  project,
  onSendMessage,
  onToggleTask,
  tier,
  usage,
  onRecordTokens,
  onUpgrade,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = project?.messages ?? [];

  const limit = TOKEN_LIMITS[tier];
  const isUnlimited = limit === Infinity;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - usage.tokensUsed);
  const percentUsed = isUnlimited ? 0 : Math.min(100, (usage.tokensUsed / limit) * 100);
  // Only actually blocks anything when there's a key configured — with no
  // key every reply is free mock content, so a maxed-out budget from past
  // real usage shouldn't lock someone out of mock chat.
  const overBudget = isTokenLimitReached(tier, usage.tokensUsed);
  const limitReached = overBudget && !!getApiKey();
  const nearLimit = !isUnlimited && !overBudget && percentUsed >= 90;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, open, limitReached]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachError(null);
    for (const file of Array.from(files)) {
      const { attachment, error } = await fileToAttachment(file);
      if (error) {
        setAttachError(error);
        continue;
      }
      if (attachment) setStagedAttachments((prev) => [...prev, attachment]);
    }
  };

  const handleSend = async () => {
    const content = draft.trim();
    if ((!content && stagedAttachments.length === 0) || !project || sending || limitReached) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
    };
    onSendMessage(project.id, userMessage);
    setDraft("");
    setStagedAttachments([]);
    if (!content) {
      // Attachment-only send — nothing to hand the (text-only) assistant API,
      // so just acknowledge it locally instead of pretending to analyze it.
      onSendMessage(project.id, {
        role: "assistant",
        content: "Got your file — I can't read file contents yet, but it's saved here in the thread.",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setSending(true);
    setChatError(null);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: {
            goal: project.goal,
            milestones: project.milestones,
            createdAt: project.createdAt,
            deadline: project.deadline,
            lastActiveDate: project.lastActiveDate,
            streakCount: project.streakCount,
          },
          message: content,
          history,
          apiKey: getApiKey(),
        }),
      });
      const data = await res.json();

      if (data.error) {
        setChatError(data.error);
        return;
      }

      onSendMessage(project.id, {
        role: "assistant",
        content: data.reply ?? "Something went wrong generating a reply.",
        timestamp: new Date().toISOString(),
      });

      if (data.actions) {
        for (const action of data.actions) {
          onToggleTask(action.milestoneIndex, action.taskIndex);
        }
      }

      // Mock replies never carry a usage field, so this is naturally a
      // no-op (and thus free) whenever there's no real key configured.
      if (data.usage) {
        onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
      }
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
          <div className="min-w-0">
            <p className="eyebrow text-accent">Mission Assistant</p>
            <h2 className="text-xl font-bold text-ink-primary mt-1 truncate">{project?.name ?? "AI Chat"}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-ink-secondary hover:text-accent hover:bg-accent-soft transition-colors shrink-0"
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="divider shrink-0" />

        <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="eyebrow text-center mt-8">
              Ask about this project&apos;s milestones, progress, or what to do next.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] flex flex-col gap-2 rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "self-end bg-accent-soft border border-accent/30 text-ink-primary"
                  : "self-start bg-card-muted border border-line text-ink-secondary"
              }`}
            >
              {m.content && (m.role === "assistant" ? <MarkdownText text={m.content} /> : <span className="leading-relaxed">{m.content}</span>)}
              {m.attachments && m.attachments.length > 0 && (
                <AttachmentList attachments={m.attachments} size="sm" />
              )}
            </div>
          ))}
          {sending && (
            <div className="self-start rounded-2xl px-4 py-2.5 text-sm bg-card-muted border border-line text-ink-faint">
              Thinking…
            </div>
          )}

          {chatError && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-xs text-warn leading-snug mt-1">
              Couldn&apos;t reach the Anthropic API: {chatError} — check your key in Settings, or leave it blank to
              use demo replies.
            </div>
          )}

          {nearLimit && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 text-xs text-ink-secondary leading-snug mt-1">
              You&apos;re at {Math.round(percentUsed)}% of your monthly AI usage — about{" "}
              {remaining.toLocaleString()} tokens left before real replies switch to demo mode.
            </div>
          )}

          {limitReached && (
            <div className="rounded-xl border border-warn/30 bg-warn-soft p-3.5 flex flex-col gap-2.5 mt-1">
              <p className="text-xs text-ink-secondary leading-snug">
                You&apos;ve used all your AI tokens this month — upgrade to Gold or Platinum for more.
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
            <div className="mb-2.5" title={`${usage.tokensUsed.toLocaleString()} / ${limit.toLocaleString()} tokens used this month`}>
              <div className="flex items-center justify-between mb-1">
                <span className="eyebrow">AI usage</span>
                <span className="font-mono text-xs text-ink-faint">{Math.round(percentUsed)}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-card-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    percentUsed >= 90 ? "bg-warn" : "bg-accent"
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
              <p className="font-mono text-[0.65rem] text-ink-faint mt-1 text-center">
                {usage.tokensUsed.toLocaleString()} / {limit.toLocaleString()} tokens this month
              </p>
            </div>
          )}

          {attachError && <p className="text-xs text-warn leading-snug mb-2">{attachError}</p>}

          {stagedAttachments.length > 0 && (
            <div className="mb-2">
              <AttachmentList
                attachments={stagedAttachments}
                size="sm"
                onRemove={(id) => setStagedAttachments((prev) => prev.filter((a) => a.id !== id))}
              />
            </div>
          )}

          <div
            className={`flex items-end gap-2 rounded-2xl border bg-card-muted transition-colors px-3 py-2 ${
              limitReached ? "border-line opacity-60" : "border-line focus-within:border-accent"
            }`}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={limitReached}
              className="shrink-0 p-2 rounded-xl text-ink-faint hover:text-accent hover:bg-accent-soft disabled:pointer-events-none transition-colors"
              aria-label="Attach files"
            >
              <PaperclipIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
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
              placeholder={limitReached ? "Monthly AI usage limit reached" : "Ask about this project..."}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none py-1.5 max-h-24 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={(!draft.trim() && stagedAttachments.length === 0) || sending || limitReached}
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
