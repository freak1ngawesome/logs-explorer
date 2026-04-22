"use client";

import { Fragment, useMemo } from "react";
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
import { CellWrapper } from "@/components/logs/cells/CellWrapper";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { createExpanderColumn } from "@/components/shared/RowExpander";
import { LogTable } from "@/components/logs/LogTable";
import { cn } from "@/lib/utils";
import {
  groupByField,
  GROUP_BY_ATTRIBUTE,
  GROUP_BY_LABEL,
  type LogGroup,
  type GroupByField,
} from "@/lib/logs/groupBy.util";
import type { LogRecord } from "@/lib/logs/types";

type ColumnId = "expander" | "key" | "count";

const COLUMN_CLASSES: Record<ColumnId, string> = {
  expander: "w-[40px] min-w-[40px] max-w-[40px]",
  key: "max-w-[1px] w-full overflow-hidden",
  count: "w-[80px] min-w-[80px] max-w-[80px]",
};

function makeColumns(label: string): ColumnDef<LogGroup>[] {
  return [
    createExpanderColumn<LogGroup>(),
    {
      accessorKey: "key",
      sortDescFirst: false,
      header: ({ column }) => (
        <SortableHeader<LogGroup> column={column} label={label} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.key}</span>
      ),
    },
    {
      accessorKey: "count",
      sortDescFirst: true,
      header: ({ column }) => (
        <SortableHeader<LogGroup> column={column} label="Logs" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.count}</span>
      ),
    },
  ];
}

interface LogsGroupbyProps {
  records: LogRecord[];
  groupBy: Exclude<GroupByField, "none">;
}

export function LogsGroupby({ records, groupBy }: LogsGroupbyProps) {
  const groups = useMemo(
    () => groupByField(records, GROUP_BY_ATTRIBUTE[groupBy]),
    [records, groupBy],
  );

  const label = GROUP_BY_LABEL[groupBy];

  const columns = useMemo(() => makeColumns(label), [label]);

  const table = useReactTable({
    data: groups,
    columns,
    initialState: {
      sorting: [{ id: "count", desc: true }],
    },
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.key,
  });

  return (
    <Table>
      <TableHeader
        className="sticky z-10 bg-background"
        style={{ top: "var(--log-controls-h, 0px)" }}
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
                className="cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                {row.getVisibleCells().map((cell) => (
                  <CellWrapper
                    key={cell.id}
                    className={cn(
                      "text-sm",
                      COLUMN_CLASSES[cell.column.id as ColumnId] ?? "w-auto",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </CellWrapper>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow className="bg-primary-foreground">
                  <TableCell colSpan={columns.length} className={cn("p-0 pl-4")}>
                    <LogTable
                      records={row.original.records}
                      stickyHeader={false}
                    />
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
