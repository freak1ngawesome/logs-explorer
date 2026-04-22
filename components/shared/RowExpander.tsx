"use client";

import { ChevronRight } from "lucide-react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface RowExpanderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function RowExpander({ isExpanded, onToggle }: RowExpanderProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      tabIndex={-1}
    >
      <ChevronRight
        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
      />
    </Button>
  );
}

export function createExpanderColumn<T extends RowData>(): ColumnDef<T> {
  return {
    id: "expander",
    enableSorting: false,
    header: "",
    cell: ({ row }) => (
      <RowExpander
        isExpanded={row.getIsExpanded()}
        onToggle={row.getToggleExpandedHandler()}
      />
    ),
  };
}
