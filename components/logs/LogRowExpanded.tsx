import type { LogRecord } from "@/lib/logs/types";

interface LogRowExpandedProps {
  record: LogRecord;
}

export function LogRowExpanded({ record }: LogRowExpandedProps) {
  const { attributes } = record;
  const entries = Object.entries(attributes).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const hasTrace = "trace_id" in attributes || "span_id" in attributes;

  return (
    <div className="space-y-4 p-4">
      {hasTrace && (
        <div className="space-y-1">
          {attributes["trace_id"] && (
            <div className="text-sm">
              <span className="text-muted-foreground">trace_id: </span>
              <span className="font-mono">{attributes["trace_id"]}</span>
            </div>
          )}
          {attributes["span_id"] && (
            <div className="text-sm">
              <span className="text-muted-foreground">span_id: </span>
              <span className="font-mono">{attributes["span_id"]}</span>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attributes</p>
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
          {entries.map(([key, value], i) => (
            <div key={key} className="col-span-2 grid grid-cols-subgrid">
              <div
                className={`py-1 pr-2 text-right font-mono text-muted-foreground ${
                  i % 2 === 0 ? "bg-muted/30" : ""
                }`}
              >
                {key}
              </div>
              <div
                className={`break-all py-1 ${i % 2 === 0 ? "bg-muted/30" : ""}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
