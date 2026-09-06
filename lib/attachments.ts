import { Attachment } from "./types";

// This app only has localStorage to work with (no object store, no backend),
// so a generous-but-bounded per-file cap keeps a few images from silently
// blowing the ~5-10MB localStorage quota and corrupting all saved projects.
export const MAX_ATTACHMENT_SIZE_BYTES = 4 * 1024 * 1024;

export function makeAttachmentId(): string {
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isImageAttachment(a: Pick<Attachment, "type">): boolean {
  return a.type.startsWith("image/");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface FileToAttachmentResult {
  attachment: Attachment | null;
  error: string | null;
}

/** Reads a single File into an Attachment, or returns an error if it's over the size cap. */
export async function fileToAttachment(file: File): Promise<FileToAttachmentResult> {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      attachment: null,
      error: `"${file.name}" is over ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)} and can't be attached here.`,
    };
  }
  const dataUrl = await readAsDataUrl(file);
  return {
    attachment: {
      id: makeAttachmentId(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl,
    },
    error: null,
  };
}
