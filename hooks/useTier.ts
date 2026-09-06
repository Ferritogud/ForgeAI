"use client";

import { useCallback, useEffect, useState } from "react";
import { Tier } from "@/lib/types";
import { loadTier, saveTier } from "@/lib/storage";
import { TIER_LIMITS } from "@/lib/tiers";

export function useTier() {
  const [tier, setTierState] = useState<Tier>("bronze");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTierState(loadTier());
    setReady(true);
  }, []);

  const setTier = useCallback((next: Tier) => {
    setTierState(next);
    saveTier(next);
  }, []);

  return { tier, setTier, ready, limit: TIER_LIMITS[tier] };
}
