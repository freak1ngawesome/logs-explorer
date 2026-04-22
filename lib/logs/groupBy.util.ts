import type { LogRecord } from "@/lib/logs/types";

export type GroupByField = "none" | "service.name";

export const GROUP_BY_ATTRIBUTE: Record<
  Exclude<GroupByField, "none">,
  string
> = {
  "service.name": "resource.service.name",
};

export const GROUP_BY_LABEL: Record<Exclude<GroupByField, "none">, string> = {
  "service.name": "Service",
};

export interface LogGroup {
  key: string;
  records: LogRecord[];
  count: number;
}

export function groupByField(
  records: LogRecord[],
  attributeKey: string,
): LogGroup[] {
  const map = new Map<string, LogRecord[]>();

  for (const record of records) {
    const key = record.attributes[attributeKey] ?? "(unknown)";
    const group = map.get(key);
    if (group) {
      group.push(record);
    } else {
      map.set(key, [record]);
    }
  }

  return Array.from(map.entries()).map(([key, recs]) => ({
    key,
    records: recs,
    count: recs.length,
  }));
}
