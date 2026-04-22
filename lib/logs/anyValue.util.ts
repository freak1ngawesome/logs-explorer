import type { AnyValue } from "../otlp-types";

export function anyValueToString(value: AnyValue | null | undefined): string {
  if (value == null) return "";
  if (value.stringValue != null) return value.stringValue;
  if (value.intValue != null) return String(value.intValue);
  if (value.doubleValue != null) return String(value.doubleValue);
  if (value.boolValue != null) return value.boolValue ? "true" : "false";
  if (value.arrayValue != null) return JSON.stringify(value.arrayValue);
  if (value.kvlistValue != null) return JSON.stringify(value.kvlistValue);
  return "";
}
