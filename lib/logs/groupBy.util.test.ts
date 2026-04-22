import { describe, it, expect } from "vitest";
import { groupByField } from "@/lib/logs/groupBy.util";
import type { LogRecord } from "@/lib/logs/types";
import { SeverityNumber } from "@/generated/opentelemetry/proto/logs/v1/logs";

function makeRecord(id: string, serviceName?: string): LogRecord {
  return {
    id,
    timestamp: new Date("2024-01-01T00:00:00.000Z"),
    severityNumber: SeverityNumber.SEVERITY_NUMBER_INFO,
    body: "test",
    attributes: serviceName ? { "resource.service.name": serviceName } : {},
  };
}

const ATTR = "resource.service.name";

describe("groupByField", () => {
  it("returns empty array for empty input", () => {
    expect(groupByField([], ATTR)).toEqual([]);
  });

  it("groups records by resource.service.name", () => {
    const records = [
      makeRecord("1", "api"),
      makeRecord("2", "api"),
      makeRecord("3", "worker"),
    ];
    const groups = groupByField(records, ATTR);
    expect(groups).toHaveLength(2);
    const api = groups.find((g) => g.key === "api");
    expect(api?.count).toBe(2);
    expect(api?.records).toHaveLength(2);
  });

  it("puts records without resource.service.name into (unknown)", () => {
    const records = [makeRecord("1"), makeRecord("2", "api")];
    const groups = groupByField(records, ATTR);
    const unknown = groups.find((g) => g.key === "(unknown)");
    expect(unknown?.count).toBe(1);
  });

  it("sorts groups by count desc", () => {
    const records = [
      makeRecord("1", "rare"),
      makeRecord("2", "common"),
      makeRecord("3", "common"),
      makeRecord("4", "common"),
    ];
    const groups = groupByField(records, ATTR);
    expect(groups[0].key).toBe("common");
    expect(groups[0].count).toBe(3);
    expect(groups[1].key).toBe("rare");
  });

  it("breaks count ties alphabetically by key", () => {
    const records = [
      makeRecord("1", "zebra"),
      makeRecord("2", "apple"),
    ];
    const groups = groupByField(records, ATTR);
    expect(groups[0].key).toBe("apple");
    expect(groups[1].key).toBe("zebra");
  });

  it("preserves insertion order within each group", () => {
    const records = [
      makeRecord("1", "svc"),
      makeRecord("2", "svc"),
      makeRecord("3", "svc"),
    ];
    const [group] = groupByField(records, ATTR);
    expect(group.records.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});
