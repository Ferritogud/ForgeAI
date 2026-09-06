"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BADGE_DEFS, BadgeDef, BadgeId, EarnedBadge } from "@/lib/badges";

const KEY = "forgeai_badges";
const TOAST_DURATION_MS = 4000;

export function useBadges() {
  const [ready, setReady] = useState(false);
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [justEarned, setJustEarned] = useState<BadgeDef | null>(null);
  const earnedRef = useRef<EarnedBadge[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEarned(parsed);
          earnedRef.current = parsed;
        }
      } catch {
        // ignore corrupt data
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(earned));
  }, [earned, ready]);

  // Guards against re-triggering the toast on every call once a badge is
  // already earned — award() gets called opportunistically from effects that
  // re-run often, so this needs to be a synchronous, always-current check.
  const award = useCallback((id: BadgeId) => {
    if (earnedRef.current.some((b) => b.id === id)) return;
    const def = BADGE_DEFS.find((d) => d.id === id);
    const entry: EarnedBadge = { id, earnedAt: new Date().toISOString() };
    earnedRef.current = [...earnedRef.current, entry];
    setEarned(earnedRef.current);
    if (def) setJustEarned(def);
  }, []);

  useEffect(() => {
    if (!justEarned) return;
    const timer = setTimeout(() => setJustEarned(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [justEarned]);

  return { ready, earned, justEarned, award };
}
