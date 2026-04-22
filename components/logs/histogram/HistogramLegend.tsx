"use client";

import { RotateCcw } from "lucide-react";
import type { SeenSeverity } from "./types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LegendProps {
  seen: SeenSeverity[];
  disabled: string[];
  onToggle: (label: string) => void;
  onReset: () => void;
  isDefaultState: boolean;
}

export function LogHistogramLegend({
  seen,
  disabled,
  onToggle,
  onReset,
  isDefaultState,
}: LegendProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      {seen.map((sev) => {
        const isDisabled = disabled.includes(sev.label);
        return (
          <span
            key={sev.label}
            role="button"
            tabIndex={0}
            aria-pressed={!isDisabled}
            onClick={() => onToggle(sev.label)}
            className={cn(
              "flex items-center gap-1.5 cursor-pointer select-none text-xs text-foreground",
              isDisabled ? "opacity-35" : "opacity-100",
            )}
          >
            <span
              className={cn("inline-block h-2.5 w-2.5 rounded-sm shrink-0")}
              style={
                isDisabled
                  ? {
                      border: `2px solid ${sev.color}`,
                      background: "transparent",
                    }
                  : { background: sev.color }
              }
            />
            {sev.label}
          </span>
        );
      })}
      <Button
        onClick={onReset}
        disabled={isDefaultState}
        title="Reset selection"
        variant="outline"
        size="icon-xs"
        className={"cursor-pointer"}
      >
        <RotateCcw size={10} />
      </Button>
    </div>
  );
}
