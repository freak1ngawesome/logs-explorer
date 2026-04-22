import { describe, it, expect } from "vitest";
import { toHistogramBuckets } from "@/lib/logs/histogram.util";
import { LogRecord } from "@/lib/logs/types";
import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";

function makeRecord(
  timestamp: Date,
  severityNumber: SeverityNumber,
): LogRecord {
  return {
    id: `${timestamp.getTime()}-${severityNumber}`,
    timestamp,
    severityNumber,
    body: "test",
    attributes: {},
  };
}

const DAY = 24 * 60 * 60 * 1000;

describe("toHistogramBuckets", () => {
  it("returns empty array for empty input", () => {
    expect(toHistogramBuckets([])).toEqual([]);
  });

  it("produces a single bucket when all records are on the same day", () => {
    const day = new Date("2024-01-15T10:00:00.000Z");
    const records = [
      makeRecord(day, SeverityNumber.SEVERITY_NUMBER_INFO),
      makeRecord(new Date("2024-01-15T14:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_ERROR),
    ];
    const buckets = toHistogramBuckets(records);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].time).toBe("2024-01-15");
    expect(buckets[0].counts.Info).toBe(1);
    expect(buckets[0].counts.Error).toBe(1);
  });

  it("fills zero-count buckets for days with no records", () => {
    const records = [
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_INFO),
      makeRecord(new Date("2024-01-03T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_WARN),
    ];
    const buckets = toHistogramBuckets(records);
    expect(buckets).toHaveLength(3);
    expect(buckets[0].time).toBe("2024-01-01");
    expect(buckets[1].time).toBe("2024-01-02");
    expect(buckets[1].counts.Info).toBeUndefined();
    expect(buckets[2].time).toBe("2024-01-03");
  });

  it("sorts buckets ascending by day", () => {
    const records = [
      makeRecord(new Date("2024-01-05T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_DEBUG),
      makeRecord(new Date("2024-01-02T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_ERROR),
    ];
    const buckets = toHistogramBuckets(records);
    expect(buckets[0].time < buckets[buckets.length - 1].time).toBe(true);
  });

  it("uses title-cased label as severity key", () => {
    const records = [
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_ERROR),
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_FATAL),
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_TRACE),
    ];
    const [bucket] = toHistogramBuckets(records);
    expect(bucket.counts.Error).toBe(1);
    expect(bucket.counts.Fatal).toBe(1);
    expect(bucket.counts.Trace).toBe(1);
  });

  it("aggregates counts per severity within a bucket", () => {
    const records = [
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_INFO),
      makeRecord(new Date("2024-01-01T06:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_INFO),
      makeRecord(new Date("2024-01-01T12:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_INFO),
    ];
    const [bucket] = toHistogramBuckets(records);
    expect(bucket.counts.Info).toBe(3);
  });

  it("maps SEVERITY_NUMBER_UNSPECIFIED to 'Unspecified'", () => {
    const records = [
      makeRecord(new Date("2024-01-01T00:00:00.000Z"), SeverityNumber.SEVERITY_NUMBER_UNSPECIFIED),
    ];
    const [bucket] = toHistogramBuckets(records);
    expect(bucket.counts.Unspecified).toBe(1);
  });
});
