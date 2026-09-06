/** Whole calendar days between today and a YYYY-MM-DD deadline (negative if past). */
export function daysUntil(deadline: string, now: Date = new Date()): number {
  const target = new Date(`${deadline}T00:00:00`);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}
