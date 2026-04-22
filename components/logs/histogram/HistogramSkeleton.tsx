import { Skeleton } from "@/components/ui/skeleton";
const BAR_HEIGHTS = [
  45, 80, 30, 55, 90, 20, 65, 75, 40, 85, 35, 60, 95, 25, 70, 50, 80, 45, 65,
  90, 35, 55, 75, 40, 85, 30, 60, 95, 45, 70,
];

export function HistogramSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>

      <div className="flex-1 overflow-auto">
        {/* Controls (sticky, matches real z-30) */}
        <div className="sticky top-0 z-30 bg-background p-1">
          {/* FilterBar */}
          <Skeleton className="h-9 w-full rounded-md" />

          {/* Histogram */}
          <div className="mt-1 px-2">
            {/* Bar chart area */}
            <div className="flex h-[120px] items-end gap-[3px]">
              {BAR_HEIGHTS.map((h, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            {/* X-axis labels */}
            <div className="mt-1 flex justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-2.5 w-16" />
              ))}
            </div>
            {/* Legend */}
            <div className="mt-2 flex justify-center gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
