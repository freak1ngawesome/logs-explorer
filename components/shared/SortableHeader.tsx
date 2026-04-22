"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";

interface SortableHeaderProps<T> {
  column: Column<T>;
  label: string;
}

export function SortableHeader<T>({ column, label }: SortableHeaderProps<T>) {
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
