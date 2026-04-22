import { useState } from "react";
import type { ExpandedState, Updater } from "@tanstack/react-table";

export function useSingleRowExpand() {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const expanded: ExpandedState = expandedRowId ? { [expandedRowId]: true } : {};

  function onExpandedChange(updater: Updater<ExpandedState>) {
    const next = typeof updater === "function" ? updater(expanded) : updater;
    if (
      typeof next === "boolean" ||
      Object.keys(next).filter((k) => next[k]).length === 0
    ) {
      setExpandedRowId(null);
      return;
    }
    const newKey = Object.keys(next)
      .filter((k) => next[k])
      .find((k) => k !== expandedRowId);
    setExpandedRowId(newKey ?? null);
  }

  return { expanded, onExpandedChange };
}
