"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Attachment } from "@/lib/types";
import { formatFileSize, isImageAttachment } from "@/lib/attachments";

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none">
      <path
        d="M4 1.8h5.2L12.5 5v9.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.8a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9 1.8V5h3.3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  /** Compact chips for chat bubbles vs. larger tiles for the Notes tab. */
  size?: "sm" | "md";
}

export default function AttachmentList({ attachments, onRemove, size = "md" }: AttachmentListProps) {
  const [lightbox, setLightbox] = useState<Attachment | null>(null);

  if (attachments.length === 0) return null;

  const tileSize = size === "sm" ? "w-14 h-14" : "w-20 h-20";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => {
          const isImage = isImageAttachment(a);
          return (
            <div key={a.id} className="group/att relative">
              {isImage ? (
                <button
                  onClick={() => setLightbox(a)}
                  className={`${tileSize} rounded-lg overflow-hidden border border-line hover:border-accent transition-colors`}
                  title={a.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.dataUrl} alt={a.name} className="w-full h-full object-cover" />
                </button>
              ) : (
                <a
                  href={a.dataUrl}
                  download={a.name}
                  className={`${tileSize} flex flex-col items-center justify-center gap-1 rounded-lg border border-line bg-card-muted hover:border-accent text-ink-secondary hover:text-accent transition-colors p-1.5`}
                  title={`${a.name} (${formatFileSize(a.size)})`}
                >
                  <FileIcon />
                  <span className="text-[0.6rem] leading-tight text-center truncate w-full">{a.name}</span>
                </a>
              )}

              {onRemove && (
                <button
                  onClick={() => onRemove(a.id)}
                  className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 flex items-center justify-center rounded-full bg-warn text-white opacity-0 group-hover/att:opacity-100 transition-opacity"
                  aria-label={`Remove ${a.name}`}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {lightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
            onClick={() => setLightbox(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.dataUrl}
              alt={lightbox.name}
              className="max-w-full max-h-full rounded-xl shadow-lg"
            />
          </div>,
          document.body
        )}
    </>
  );
}
