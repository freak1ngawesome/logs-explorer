"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BodyCellProps {
  body: string;
  isExpanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function BodyCell({ body, isExpanded, onToggle }: BodyCellProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="truncate min-w-0 flex-1 select-text" title={body}>
        {body}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onToggle}
      >
        <ChevronRight
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
      </Button>
    </div>
  );
}
