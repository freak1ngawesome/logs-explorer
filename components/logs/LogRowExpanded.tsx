import type { LogRecord } from "@/lib/logs/types";
import { splitAttributes } from "@/lib/logs/attributes.util";

interface LogRowExpandedProps {
  record: LogRecord;
}

function AttributeList({ entries }: { entries: [string, string][] }) {
  if (entries.length === 0) return null;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
      {entries.map(([key, value], i) => (
        <div key={key} className="col-span-2 grid grid-cols-subgrid">
          <div
            className={`py-1 pr-2 text-right font-mono text-muted-foreground ${i % 2 === 0 ? "bg-muted/30" : ""}`}
          >
            {key}
          </div>
          <div className={`break-all py-1 font-mono text-xs ${i % 2 === 0 ? "bg-muted/30" : ""}`}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function LogRowExpanded({ record }: LogRowExpandedProps) {
  const { attributes, body } = record;
  const { resource: resourceEntries, scope: scopeEntries, log: logEntries } = splitAttributes(attributes);

  return (
    <div className="space-y-3 p-4">
      {(resourceEntries.length > 0 || scopeEntries.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {resourceEntries.length > 0 && (
            <div className="rounded-md border p-3">
              <SectionLabel>Resource</SectionLabel>
              <AttributeList entries={resourceEntries} />
            </div>
          )}
          {scopeEntries.length > 0 && (
            <div className="rounded-md border p-3">
              <SectionLabel>Scope</SectionLabel>
              <AttributeList entries={scopeEntries} />
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border p-3">
        <SectionLabel>Log</SectionLabel>
        <pre className="mb-3 rounded-md border bg-muted p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {body}
        </pre>
        <AttributeList entries={logEntries} />
      </div>
    </div>
  );
}
