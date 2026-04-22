"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import type { LogRecord } from "@/lib/logs/types";

interface SortableHeaderProps {
  column: Column<LogRecord>;
  label: string;
}

export function SortableHeader({ column, label }: SortableHeaderProps) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === false ? ArrowUpDown : sorted === "desc" ? ArrowDown : ArrowUp;

  return (
    <button
      type="button"
      className="flex cursor-pointer select-none items-center gap-1"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      <Icon
        className={`h-3 w-3 ${sorted === false ? "text-muted-foreground" : ""}`}
      />
    </button>
  );
}
