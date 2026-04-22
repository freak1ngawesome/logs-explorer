"use client";

import { useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getUserTimezone } from "@/lib/logs/format.util";
import { logsQueryOptions } from "@/lib/logs/queries";
import { SEVERITY_META } from "@/lib/logs/severity.util";
import { cn } from "@/lib/utils";

const timezone = getUserTimezone();

function SeverityChip({ count, band }: { count: number; band: keyof typeof SEVERITY_META }) {
  if (count === 0) return null;
  const { label, textClass } = SEVERITY_META[band];
  return (
    <span className={cn("font-medium", textClass)}>
      · {count} {label}
    </span>
  );
}

export function LogsPageHeader() {
  const { data, refetch, isFetching } = useQuery(logsQueryOptions);
  const [isPending, startTransition] = useTransition();

  function handleReload() {
    startTransition(() => {
      refetch();
    });
  }

  if (!data) return null;

  const { stats } = data;
  const isLoading = isFetching || isPending;

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">Logs Explorer</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            Showing {stats.displayed} logs out of {stats.total}
          </span>
          <SeverityChip count={stats.warn} band="WARN" />
          <SeverityChip count={stats.error} band="ERROR" />
          <SeverityChip count={stats.fatal} band="FATAL" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled className="gap-2 text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span>Last 30 minutes</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{timezone}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={handleReload}
          aria-label="Reload logs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  );
}
