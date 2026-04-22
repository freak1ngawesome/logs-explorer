"use client";

import { Fragment, useMemo, useCallback, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityPill } from "@/components/shared/SeverityPill";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { BodyCell } from "@/components/logs/cells/BodyCell";
import { CellWrapper } from "@/components/logs/cells/CellWrapper";
import { ResourceCell } from "@/components/logs/cells/ResourceCell";
import { LogRowExpanded } from "@/components/logs/LogRowExpanded";
import { formatTimestamp } from "@/lib/logs/format.util";
import { cn } from "@/lib/utils";
import type { LogRecord } from "@/lib/logs/types";

type ColumnId = "severityNumber" | "timestamp" | "resource" | "body";

const COLUMN_CLASSES: Record<ColumnId, string> = {
  severityNumber: "w-[120px] min-w-[120px] max-w-[120px]",
  timestamp: "w-[200px] min-w-[200px] max-w-[200px]",
  resource: "w-auto max-w-[400px] overflow-hidden",
  body: "max-w-[1px] w-full overflow-hidden",
};

function getCellClasses(columnId: ColumnId | string): string {
  return COLUMN_CLASSES[columnId as ColumnId] ?? "w-auto";
}

const columns = [
  {
    accessorKey: "severityNumber",
    header: ({ column }) => <SortableHeader column={column} label="Severity" />,
    cell: ({ row }) => (
      <SeverityPill severityNumber={row.original.severityNumber} />
    ),
  },
  {
    accessorKey: "timestamp",
    sortDescFirst: true,
    header: ({ column }) => <SortableHeader column={column} label="Time" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {formatTimestamp(row.original.timestamp)}
      </span>
    ),
  },
  {
    accessorKey: "resource",
    enableSorting: false,
    header: "Resource",
    cell: ({ row }) => <ResourceCell attributes={row.original.attributes} />,
  },
  {
    accessorKey: "body",
    enableSorting: false,
    header: "Body",
    cell: ({ row }) => (
      <BodyCell
        body={row.original.body}
        isExpanded={row.getIsExpanded()}
        onToggle={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
      />
    ),
  },
] satisfies (ColumnDef<LogRecord> & { accessorKey: ColumnId })[];

interface LogTableProps {
  records: LogRecord[];
}

export function LogTable({ records }: LogTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const expanded: ExpandedState = useMemo(
    () => (expandedRowId ? { [expandedRowId]: true } : {}),
    [expandedRowId],
  );

  const onExpandedChange = useCallback(
    (
      updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState),
    ) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(expanded)
          : updaterOrValue;

      if (
        typeof next === "boolean" ||
        Object.keys(next).filter((k) => next[k]).length === 0
      ) {
        setExpandedRowId(null);
        return;
      }

      const expandedKeys = Object.keys(next).filter((k) => next[k]);
      const newKey = expandedKeys.find((k) => k !== expandedRowId);
      setExpandedRowId(newKey ?? null);
    },
    [expanded, expandedRowId],
  );

  const table = useReactTable({
    data: records,
    columns,
    initialState: {
      sorting: [{ id: "timestamp", desc: true }],
    },
    state: { expanded },
    onExpandedChange,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center">
              No log records found.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                className="cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => (
                  <CellWrapper
                    key={cell.id}
                    className={cn("text-sm", getCellClasses(cell.column.id))}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </CellWrapper>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <LogRowExpanded record={row.original} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}
