"use client";

import { useRef, useLayoutEffect } from "react";
import { FilterBar } from "@/components/shared/FilterBar";
import { LogHistogram } from "@/components/logs/histogram";
import { LogTable } from "@/components/logs/LogTable";
import type { LogRecord } from "@/lib/logs/types";

interface LogsPageWrapperProps {
  records: LogRecord[];
}

export function LogsPageWrapper({ records }: LogsPageWrapperProps) {
  const controlsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (controlsRef.current) {
      document.documentElement.style.setProperty(
        "--log-controls-h",
        `${controlsRef.current.offsetHeight}px`,
      );
    }
  });

  return (
    <div className="flex-1 overflow-auto">
      <div ref={controlsRef} className="sticky top-0 z-30 bg-background p-1">
        <FilterBar />
        <LogHistogram records={records} />
      </div>
      <LogTable records={records} />
    </div>
  );
}
