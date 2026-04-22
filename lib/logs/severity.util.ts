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

export const SEVERITY_META: Record<
  SeverityBand,
  { textClass: string; label: string; color: string; order: number }
> = {
  UNSPECIFIED: {
    textClass: "text-zinc-500",
    label: "Unspecified",
    color: "var(--color-zinc-500)",
    order: 0,
  },
  TRACE: {
    textClass: "text-zinc-400",
    label: "Trace",
    color: "var(--color-zinc-400)",
    order: 1,
  },
  DEBUG: {
    textClass: "text-blue-400",
    label: "Debug",
    color: "var(--color-blue-400)",
    order: 2,
  },
  INFO: {
    textClass: "text-green-400",
    label: "Info",
    color: "var(--color-green-400)",
    order: 3,
  },
  WARN: {
    textClass: "text-amber-400",
    label: "Warn",
    color: "var(--color-amber-400)",
    order: 4,
  },
  ERROR: {
    textClass: "text-red-400",
    label: "Error",
    color: "var(--color-red-400)",
    order: 5,
  },
  FATAL: {
    textClass: "text-red-300",
    label: "Fatal",
    color: "var(--color-red-300)",
    order: 6,
  },
};

export function getSeverityMeta(severityNumber: number): {
  textClass: string;
  label: string;
  color: string;
  order: number;
} {
  const band = deriveSeverityText(severityNumber);
  return SEVERITY_META[band];
}
