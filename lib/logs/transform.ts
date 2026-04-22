import type {
  ExportLogsServiceRequest,
  KeyValue,
  LogRecord as OtlpLogRecord,
  ResourceLogs,
  ScopeLogs,
} from "../otlp-types";
import type { LogRecord } from "./types";
import { anyValueToString } from "./anyValue.util";
import { parseTimestamp, buildId } from "./logRecord.util";

function flattenAttributes(
  kvs: KeyValue[] | undefined,
  prefix: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!kvs) return result;
  for (const kv of kvs) {
    if (kv.key === "droppedAttributesCount") continue;
    result[`${prefix}${kv.key}`] = anyValueToString(kv.value);
  }
  return result;
}

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");

function buildResourceAttrs(rl: ResourceLogs): Record<string, string> {
  return flattenAttributes(rl.resource?.attributes, "resource.");
}

function buildScopeAttrs(sl: ScopeLogs): Record<string, string> {
  return {
    ...(sl.scope?.name ? { "scope.name": sl.scope.name } : {}),
    ...(sl.scope?.version ? { "scope.version": sl.scope.version } : {}),
    ...flattenAttributes(sl.scope?.attributes, "scope."),
  };
}

function buildLogAttrs(lr: OtlpLogRecord): Record<string, string> {
  return {
    ...flattenAttributes(lr.attributes, ""),
    ...(lr.traceId ? { trace_id: toHex(lr.traceId) } : {}),
    ...(lr.spanId ? { span_id: toHex(lr.spanId) } : {}),
  };
}

export function transform(payload: ExportLogsServiceRequest): LogRecord[] {
  return payload.resourceLogs.flatMap((rl, ri) => {
    const resourceAttrs = buildResourceAttrs(rl);
    return rl.scopeLogs.flatMap((sl, si) => {
      const scopeAttrs = buildScopeAttrs(sl);
      return sl.logRecords.map((lr, li) => ({
        id: buildId(ri, si, li),
        timestamp: parseTimestamp(
          String(lr.timeUnixNano),
          String(lr.observedTimeUnixNano),
        ),
        severityNumber: lr.severityNumber,
        body: anyValueToString(lr.body),
        attributes: {
          ...resourceAttrs,
          ...scopeAttrs,
          ...buildLogAttrs(lr),
        },
      }));
    });
  });
}
