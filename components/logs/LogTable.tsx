"use client";

import { Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityCell } from "@/components/logs/cells/SeverityCell";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { createExpanderColumn } from "@/components/shared/RowExpander";
import { BodyCell } from "@/components/logs/cells/BodyCell";
import { CellWrapper } from "@/components/logs/cells/CellWrapper";
import { ResourceCell } from "@/components/logs/cells/ResourceCell";
import { LogRowExpanded } from "@/components/logs/LogRowExpanded";
import { formatTimestamp } from "@/lib/logs/format.util";
import { useSingleRowExpand } from "@/hooks/use-single-row-expand";
import { cn } from "@/lib/utils";
import type { LogRecord } from "@/lib/logs/types";

type ColumnId =
  | "expander"
  | "severityNumber"
  | "timestamp"
  | "resource"
  | "body";

const COLUMN_CLASSES: Record<ColumnId, string> = {
  expander: "w-[40px] min-w-[40px] max-w-[40px]",
  severityNumber: "w-[120px] min-w-[120px] max-w-[120px]",
  timestamp: "w-[200px] min-w-[200px] max-w-[200px]",
  resource: "w-auto max-w-[400px] overflow-hidden",
  body: "max-w-[1px] w-full overflow-hidden",
};

function getCellClasses(columnId: ColumnId | string): string {
  return COLUMN_CLASSES[columnId as ColumnId] ?? "w-auto";
}

const columns = [
  createExpanderColumn<LogRecord>(),
  {
    accessorKey: "severityNumber",
    header: ({ column }) => (
      <SortableHeader<LogRecord> column={column} label="Severity" />
    ),
    cell: ({ row }) => (
      <SeverityCell severityNumber={row.original.severityNumber} />
    ),
  },
  {
    accessorKey: "timestamp",
    sortDescFirst: true,
    header: ({ column }) => (
      <SortableHeader<LogRecord> column={column} label="Time" />
    ),
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
    cell: ({ row }) => <BodyCell body={row.original.body} />,
  },
] satisfies ColumnDef<LogRecord>[];

interface LogTableProps {
  records: LogRecord[];
  stickyHeader?: boolean;
}

export function LogTable({ records, stickyHeader = true }: LogTableProps) {
  const { expanded, onExpandedChange } = useSingleRowExpand();

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
      <TableHeader
        className={cn("bg-background", stickyHeader && "sticky z-10")}
        style={stickyHeader ? { top: "var(--log-controls-h, 0px)" } : undefined}
      >
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
                className={cn("cursor-pointer")}
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
