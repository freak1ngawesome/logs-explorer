import { getSeverityMeta } from "@/lib/logs/severity.util";
import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";
import { cn } from "@/lib/utils";

interface SeverityPillProps {
  severityNumber: SeverityNumber;
}

export function SeverityPill({ severityNumber }: SeverityPillProps) {
  const { textClass, label } = getSeverityMeta(severityNumber);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono", textClass)}
    >
      <span className="text-[0.75em]">│</span>
      {label}
    </span>
  );
}
