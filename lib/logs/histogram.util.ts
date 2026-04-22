import { LogRecord } from "@/lib/logs/types";
import { getSeverityMeta } from "@/lib/logs/severity.util";

export interface HistogramBucket {
  time: string;
  counts: Record<string, number>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function toHistogramBuckets(records: LogRecord[]): HistogramBucket[] {
  if (records.length === 0) return [];

  let minTs = records[0].timestamp.getTime();
  let maxTs = minTs;

  for (const record of records) {
    const ts = record.timestamp.getTime();
    if (ts < minTs) minTs = ts;
    if (ts > maxTs) maxTs = ts;
  }

  const startDay = Math.floor(minTs / DAY_MS) * DAY_MS;
  const endDay = Math.floor(maxTs / DAY_MS) * DAY_MS;

  const buckets = new Map<number, HistogramBucket>();
  for (let d = startDay; d <= endDay; d += DAY_MS) {
    buckets.set(d, { time: new Date(d).toISOString().slice(0, 10), counts: {} });
  }

  for (const record of records) {
    const bucketTs = Math.floor(record.timestamp.getTime() / DAY_MS) * DAY_MS;
    const severity = getSeverityMeta(record.severityNumber).label;
    const bucket = buckets.get(bucketTs);
    if (!bucket) continue;
    bucket.counts[severity] = (bucket.counts[severity] ?? 0) + 1;
  }

  return Array.from(buckets.values());
}
