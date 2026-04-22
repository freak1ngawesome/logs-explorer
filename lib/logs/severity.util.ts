import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";

type SeverityBand =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL"
  | "UNSPECIFIED";

export function deriveSeverityText(severityNumber: number): SeverityBand {
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_TRACE &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_TRACE4
  )
    return "TRACE";
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_DEBUG &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_DEBUG4
  )
    return "DEBUG";
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_INFO &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_INFO4
  )
    return "INFO";
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_WARN &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_WARN4
  )
    return "WARN";
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_ERROR &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_ERROR4
  )
    return "ERROR";
  if (
    severityNumber >= SeverityNumber.SEVERITY_NUMBER_FATAL &&
    severityNumber <= SeverityNumber.SEVERITY_NUMBER_FATAL4
  )
    return "FATAL";
  return "UNSPECIFIED";
}

const SEVERITY_META: Record<
  SeverityBand,
  { textClass: string; label: string }
> = {
  TRACE: {
    textClass: "text-zinc-400",
    label: "Trace",
  },
  DEBUG: {
    textClass: "text-blue-400",
    label: "Debug",
  },
  INFO: {
    textClass: "text-green-400",
    label: "Info",
  },
  WARN: {
    textClass: "text-amber-400",
    label: "Warn",
  },
  ERROR: {
    textClass: "text-red-400",
    label: "Error",
  },
  FATAL: {
    textClass: "text-red-300",
    label: "Fatal",
  },
  UNSPECIFIED: {
    textClass: "text-zinc-500",
    label: "Unspecified",
  },
};

export function getSeverityMeta(severityNumber: number): {
  textClass: string;
  label: string;
} {
  const band = deriveSeverityText(severityNumber);
  return SEVERITY_META[band];
}
