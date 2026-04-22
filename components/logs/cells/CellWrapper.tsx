"use client";

import { useCallback, type ReactNode, type MouseEvent } from "react";
import { TableCell } from "@/components/ui/table";

interface CellWrapperProps {
  children: ReactNode;
  className?: string;
}

export function CellWrapper({ children, className }: CellWrapperProps) {
  const handleClick = useCallback((e: MouseEvent) => {
    if (window.getSelection()?.toString()) {
      e.stopPropagation();
    }
  }, []);

  return (
    <TableCell className={className} onClick={handleClick}>
      {children}
    </TableCell>
  );
}
