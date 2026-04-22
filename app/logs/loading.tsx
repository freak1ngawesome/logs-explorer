import { LogTableSkeleton } from "@/components/logs/LogTableSkeleton";
import { HistogramSkeleton } from "@/components/logs/histogram/HistogramSkeleton";

export default function LogsLoading() {
  return (
    <div className="flex-col items-start">
      <HistogramSkeleton />
      <LogTableSkeleton />
    </div>
  );
}
