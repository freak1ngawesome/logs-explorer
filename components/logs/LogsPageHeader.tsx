"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { LogStats } from "@/lib/logs/stats.util";
import { getUserTimezone } from "@/lib/logs/format.util";

interface LogsPageHeaderProps {
  stats: LogStats;
}

const timezone = getUserTimezone();

export function LogsPageHeader({ stats }: LogsPageHeaderProps) {
  const chips: { label: string; count: number; className: string }[] = [];
  if (stats.warn > 0)
    chips.push({
      label: "warn",
      count: stats.warn,
      className: "text-amber-400",
    });
  if (stats.error > 0)
    chips.push({
      label: "error",
      count: stats.error,
      className: "text-red-400",
    });
  if (stats.fatal > 0)
    chips.push({
      label: "fatal",
      count: stats.fatal,
      className: "text-red-300",
    });

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">Logs Explorer</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            Showing {stats.displayed} logs out of {stats.total}
          </span>
          {chips.length > 0 && (
            <>
              {chips.map((chip, i) => (
                <span key={chip.label} className="flex items-center gap-1">
                  <span className="text-muted-foreground">·</span>
                  <span className={chip.className}>
                    {chip.count} {chip.label}
                  </span>
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" disabled className="gap-2 text-xs">
        <Clock className="h-3.5 w-3.5" />
        <span>Last 30 minutes</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{timezone}</span>
      </Button>
    </div>
  );
}
