import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";

export interface LogRecord {
  id: string;
  timestamp: Date;
  severityNumber: SeverityNumber;
  body: string;
  attributes: Record<string, string>;
}
