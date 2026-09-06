import { TrashEntry } from "./types";

export const TRASH_RETENTION_DAYS = 30;

export function makeTrashId(): string {
  return `trash_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function daysRemaining(deletedAt: string): number {
  const elapsedDays = (Date.now() - new Date(deletedAt).getTime()) / 86400000;
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}

/** Drops entries older than the retention window. Run once per session load. */
export function purgeExpiredTrash(entries: TrashEntry[]): TrashEntry[] {
  return entries.filter((e) => daysRemaining(e.deletedAt) > 0);
}
