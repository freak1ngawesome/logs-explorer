"use client";

import { useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterBar } from "@/components/shared/FilterBar";
import { LogHistogram } from "@/components/logs/histogram";
import { LogTable } from "@/components/logs/LogTable";
import { logsQueryOptions } from "@/lib/logs/queries";

export function LogsPageWrapper() {
  const controlsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (controlsRef.current) {
      document.documentElement.style.setProperty(
        "--log-controls-h",
        `${controlsRef.current.offsetHeight}px`,
      );
    }
  });

  const { data } = useQuery(logsQueryOptions);

  if (!data) return null;

  return (
    <div className="flex-1 overflow-auto">
      <div ref={controlsRef} className="sticky top-0 z-30 bg-background p-1">
        <FilterBar />
        <LogHistogram records={data.records} />
      </div>
      <LogTable records={data.records} />
    </div>
  );
}
