import type { ReactNode } from "react";

interface LogViewerShellProps {
  children: ReactNode;
}

export function LogsPageWrapper({ children }: LogViewerShellProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4">{children}</div>
    </div>
  );
}
