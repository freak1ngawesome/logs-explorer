import { describe, it, expect } from "vitest";
import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";
import { computeLogStats } from "./stats.util";
import type { LogRecord } from "./types";

function makeRecord(severityNumber: SeverityNumber): LogRecord {
  return {
    id: "test",
    timestamp: new Date(),
    severityNumber,
    body: "",
    attributes: {},
  };
}

describe("computeLogStats", () => {
  it("counts severity bands from severityNumber ranges", () => {
    const records = [
      makeRecord(13), // WARN
      makeRecord(16), // WARN
      makeRecord(17), // ERROR
      makeRecord(20), // ERROR
      makeRecord(21), // FATAL
      makeRecord(24), // FATAL
      makeRecord(9), // INFO — not counted
      makeRecord(0), // UNSPECIFIED — not counted
    ];
    const stats = computeLogStats(records);
    expect(stats.warn).toBe(2);
    expect(stats.error).toBe(2);
    expect(stats.fatal).toBe(2);
    expect(stats.displayed).toBe(8);
    expect(stats.total).toBe(8);
  });

  it("sets total equal to displayed when no totals provided", () => {
    const records = [makeRecord(9), makeRecord(10)];
    const stats = computeLogStats(records);
    expect(stats.total).toBe(stats.displayed);
    expect(stats.displayed).toBe(2);
  });

  it("uses totals from endpoint when provided", () => {
    const records = [makeRecord(9)];
    const totals = { total: 100, warn: 10, error: 5, fatal: 2 };
    const stats = computeLogStats(records, totals);
    expect(stats.total).toBe(100);
    expect(stats.displayed).toBe(1);
    expect(stats.warn).toBe(10);
    expect(stats.error).toBe(5);
    expect(stats.fatal).toBe(2);
  });

  it("handles empty array", () => {
    const stats = computeLogStats([]);
    expect(stats.total).toBe(0);
    expect(stats.displayed).toBe(0);
    expect(stats.warn).toBe(0);
    expect(stats.error).toBe(0);
    expect(stats.fatal).toBe(0);
  });

  it("uses severityNumber ranges, not text matching", () => {
    const record = makeRecord(15);
    const stats = computeLogStats([record]);
    expect(stats.warn).toBe(1);
  });
});
