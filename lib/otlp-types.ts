import type { AnyValue } from "@/generated/opentelemetry/proto/common/v1/common";
import type { KeyValue } from "@/generated/opentelemetry/proto/common/v1/common";
import type { LogRecord } from "@/generated/opentelemetry/proto/logs/v1/logs";
import type { InstrumentationScope } from "@/generated/opentelemetry/proto/common/v1/common";
import type { Resource } from "@/generated/opentelemetry/proto/resource/v1/resource";
import type { ScopeLogs } from "@/generated/opentelemetry/proto/logs/v1/logs";
import type { ResourceLogs } from "@/generated/opentelemetry/proto/logs/v1/logs";
import type { ExportLogsServiceRequest } from "@/generated/opentelemetry/proto/collector/logs/v1/logs_service";

export type {
  AnyValue,
  KeyValue,
  LogRecord,
  InstrumentationScope,
  Resource,
  ScopeLogs,
  ResourceLogs,
  ExportLogsServiceRequest,
};
