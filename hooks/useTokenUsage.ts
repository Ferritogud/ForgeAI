"use client";

import { useCallback, useEffect, useState } from "react";
import { TokenUsage } from "@/lib/types";
import { loadTokenUsage, saveTokenUsage } from "@/lib/storage";

export function useTokenUsage() {
  const [usage, setUsage] = useState<TokenUsage>({ tokensUsed: 0, resetDate: "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsage(loadTokenUsage());
    setReady(true);
  }, []);

  const recordTokens = useCallback((tokens: number) => {
    if (tokens <= 0) return;
    // Re-load first so a month boundary crossed while the app was open still resets correctly.
    const current = loadTokenUsage();
    const updated: TokenUsage = { ...current, tokensUsed: current.tokensUsed + tokens };
    saveTokenUsage(updated);
    setUsage(updated);
  }, []);

  return { usage, ready, recordTokens };
}
