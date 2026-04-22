import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";
import type { LogRecord } from "./types";

export interface TotalsFromEndpoint {
  total: number;
  warn: number;
  error: number;
  fatal: number;
}

export interface LogStats {
  total: number;
  displayed: number;
  warn: number;
  error: number;
  fatal: number;
}

export function computeLogStats(
  displayed: LogRecord[],
): LogStats {
  const displayedCount = displayed.length;

  let warn = 0;
  let error = 0;
  let fatal = 0;

  for (const record of displayed) {
    const sn = record.severityNumber;
    if (
      sn >= SeverityNumber.SEVERITY_NUMBER_WARN &&
      sn <= SeverityNumber.SEVERITY_NUMBER_WARN4
    )
      warn++;
    else if (
      sn >= SeverityNumber.SEVERITY_NUMBER_ERROR &&
      sn <= SeverityNumber.SEVERITY_NUMBER_ERROR4
    )
      error++;
    else if (
      sn >= SeverityNumber.SEVERITY_NUMBER_FATAL &&
      sn <= SeverityNumber.SEVERITY_NUMBER_FATAL4
    )
      fatal++;
  }

  return {
    total: displayedCount,
    displayed: displayedCount,
    warn,
    error,
    fatal,
  };
}
