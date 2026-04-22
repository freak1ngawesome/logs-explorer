"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterBar } from "@/components/shared/FilterBar";
import { LogHistogram } from "@/components/logs/histogram";
import { LogTable } from "@/components/logs/LogTable";
import { LogsGroupby } from "@/components/logs/LogsGroupby";
import { GroupBySelector } from "@/components/logs/GroupBySelector";
import type { GroupByField } from "@/lib/logs/groupBy.util";
import { logsQueryOptions } from "@/lib/logs/queries";

export function LogsPageWrapper() {
  const controlsRef = useRef<HTMLDivElement>(null);
  const [groupBy, setGroupBy] = useState<GroupByField>("none");

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
    <div className="flex-1 overflow-auto [scrollbar-gutter:stable]">
      <div ref={controlsRef} className="sticky top-0 z-30 bg-background p-1">
        <div className="flex items-center gap-2 mb-1">
          <GroupBySelector value={groupBy} onChange={setGroupBy} />
          <FilterBar />
        </div>
        <LogHistogram records={data.records} />
      </div>
      {groupBy === "none" ? (
        <LogTable records={data.records} />
      ) : (
        <LogsGroupby records={data.records} groupBy={groupBy} />
      )}
    </div>
  );
}
