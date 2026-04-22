"use client";

import type { TooltipContentProps } from "recharts";

import { cn } from "@/lib/utils";

export function LogHistogramTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  const isVisible = active && payload && payload.length;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-md",
        isVisible ? "visible" : "invisible",
      )}
    >
      <div className="mb-1.5 font-medium">{label}</div>
      {(payload ?? [])
        .filter(({ value }) => Number(value) > 0)
        .map(({ name, color, value }) => (
          <div key={name} className="flex items-center gap-2 py-0.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: color }}
            />
            <span className="text-muted-foreground">{name}</span>
            <span className="ml-auto pl-4 font-medium">{value}</span>
          </div>
        ))}
    </div>
  );
}
