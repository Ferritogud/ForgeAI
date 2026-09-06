"use client";

import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  as?: "span" | "h3";
  className?: string;
  inputClassName?: string;
}

/**
 * Click-to-edit text, matching the sidebar's project-rename pattern but with
 * the cursor placed at the end of the text on focus rather than select-all —
 * editing a single word inside a longer task/milestone title is more common
 * here than replacing the whole string.
 */
export default function EditableText({ value, onSave, as = "span", className = "", inputClassName }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={inputClassName ?? `${className} bg-transparent border-b border-accent focus:outline-none`}
      />
    );
  }

  const Tag = as;
  return (
    <Tag
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      className={`cursor-text rounded transition-colors hover:bg-card-muted ${className}`}
      title="Click to edit"
    >
      {value}
    </Tag>
  );
}
