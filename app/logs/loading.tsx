import { Skeleton } from "@/components/ui/skeleton";
import { LogTableSkeleton } from "@/components/logs/LogTableSkeleton";

export default function LogsLoading() {
  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="flex-1 overflow-auto p-4">
        <LogTableSkeleton />
      </div>
    </>
  );
}
