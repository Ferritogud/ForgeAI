"use client";

import { useCallback, useEffect, useState } from "react";
import { ViewMode } from "@/lib/types";
import { loadViewMode, saveViewMode } from "@/lib/storage";

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>("checklist");

  useEffect(() => {
    setViewModeState(loadViewMode());
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    saveViewMode(mode);
  }, []);

  return { viewMode, setViewMode };
}
