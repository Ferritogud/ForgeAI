"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSidebarWidth, saveSidebarWidth } from "@/lib/storage";

export function useSidebarWidth() {
  const [width, setWidthState] = useState(272);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWidthState(loadSidebarWidth());
    setReady(true);
  }, []);

  const setWidth = useCallback((next: number) => {
    setWidthState(next);
    saveSidebarWidth(next);
  }, []);

  return { width, setWidth, ready };
}
