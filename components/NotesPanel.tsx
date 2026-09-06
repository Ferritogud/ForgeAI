"use client";

import { useEffect, useRef, useState } from "react";
import { Attachment } from "@/lib/types";
import { fileToAttachment } from "@/lib/attachments";
import GlassCard from "./GlassCard";
import AttachmentList from "./AttachmentList";

const SAVE_DELAY_MS = 500;

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
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

interface NotesPanelProps {
  projectId: string;
  notes: string;
  attachments: Attachment[];
  onSave: (projectId: string, notes: string) => void;
  onAddAttachment: (projectId: string, attachment: Attachment) => void;
  onRemoveAttachment: (projectId: string, attachmentId: string) => void;
}

/**
 * Plain textarea rather than a rich-text editor — notes here are a scratch
 * space, not a competing focal point, so basic markdown-style writing
 * (- lists, **bold** as literal text) is enough without adding an editor lib.
 */
export default function NotesPanel({
  projectId,
  notes,
  attachments,
  onSave,
  onAddAttachment,
  onRemoveAttachment,
}: NotesPanelProps) {
  const [value, setValue] = useState(notes);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switching projects should show that project's own notes, not a stale draft.
  // Deliberately keyed on projectId only — the debounced autosave below also
  // writes back into `notes`, and re-running this on every `notes` change
  // would stomp on whatever the user is mid-typing.
  useEffect(() => {
    setValue(notes);
    setSavedAt(null);
    setAttachError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value === notes) return;
    timerRef.current = setTimeout(() => {
      onSave(projectId, value);
      setSavedAt(Date.now());
    }, SAVE_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachError(null);
    for (const file of Array.from(files)) {
      const { attachment, error } = await fileToAttachment(file);
      if (error) {
        setAttachError(error);
        continue;
      }
      if (attachment) onAddAttachment(projectId, attachment);
    }
  };

  return (
    <GlassCard className="rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Notes</span>
        <span className="text-xs text-ink-faint font-mono">{savedAt ? "Saved" : ""}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot down anything — ideas, links, things to remember. Saved automatically as you type."
        rows={12}
        className="w-full resize-y bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none leading-relaxed font-mono"
      />

      <div className="divider" />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-faint">Files &amp; images</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-accent transition-colors"
          >
            <PaperclipIcon />
            Add files
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
        </div>

        {attachError && <p className="text-xs text-warn leading-snug">{attachError}</p>}

        {attachments.length > 0 ? (
          <AttachmentList
            attachments={attachments}
            onRemove={(id) => onRemoveAttachment(projectId, id)}
          />
        ) : (
          <p className="text-xs text-ink-faint">No files attached yet.</p>
        )}
      </div>
    </GlassCard>
  );
}
