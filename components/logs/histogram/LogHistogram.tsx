"use client";

import { memo, useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  BarStack,
} from "recharts";
import { LogRecord } from "@/lib/logs/types";
import { getSeverityMeta } from "@/lib/logs/severity.util";
import { toHistogramBuckets } from "@/lib/logs/histogram.util";
import { cn } from "@/lib/utils";
import { TICK_STYLE } from "./constants";
import { LogHistogramTooltip } from "./HistogramTooltip";
import { LogHistogramLegend } from "./HistogramLegend";
import type { SeenSeverity } from "./types";

export interface LogHistogramProps {
  records: LogRecord[];
}

export const LogHistogram = memo(function LogHistogram({
  records,
}: LogHistogramProps) {
  const seen = useMemo(() => {
    const map = new Map<string, SeenSeverity>();
    for (const record of records) {
      const meta = getSeverityMeta(record.severityNumber);
      if (!map.has(meta.label)) {
        map.set(meta.label, {
          label: meta.label,
          color: meta.color,
          order: meta.order,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.order - b.order);
  }, [records]);

  const [disabled, setDisabled] = useState<string[]>([]);

  const handleToggle = useCallback(
    (label: string) => {
      setDisabled((prev) => {
        if (prev.includes(label)) return prev.filter((l) => l !== label);
        if (seen.length - prev.length <= 1) return prev;
        return [...prev, label];
      });
    },
    [seen],
  );

  const handleReset = useCallback(() => setDisabled([]), []);

  const isDefaultState = disabled.length === 0;

  const rawBuckets = useMemo(() => toHistogramBuckets(records), [records]);

  const chartData = useMemo(
    () =>
      rawBuckets.map((bucket) => {
        const result: Record<string, string | number> = { time: bucket.time };
        for (const sev of seen) {
          result[sev.label] = disabled.includes(sev.label)
            ? 0
            : (bucket.counts[sev.label] ?? 0);
        }
        return result;
      }),
    [rawBuckets, disabled, seen],
  );

  const maxCount = useMemo(() => {
    let max = 0;
    for (const bucket of chartData) {
      const total = seen.reduce(
        (sum, sev) => sum + (Number(bucket[sev.label]) || 0),
        0,
      );
      if (total > max) max = total;
    }
    return max;
  }, [chartData, seen]);

  return (
    <div role="img" className={cn("flex flex-col gap-1 w-full")}>
      <ResponsiveContainer height={120} debounce={200}>
        <BarChart data={chartData} tabIndex={-1}>
          <XAxis dataKey="time" tick={TICK_STYLE} />
          <YAxis domain={[0, maxCount]} hide />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            content={LogHistogramTooltip}
          />
          {maxCount > 0 && (
            <ReferenceLine
              y={maxCount}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 2"
              label={{
                value: `${maxCount} max`,
                position: "insideTopLeft",
                fontSize: 11,
                fontFamily: "inherit",
                fill: "var(--muted-foreground)",
              }}
            />
          )}
          <BarStack radius={[4, 4, 0, 0]}>
            {seen.map((sev) => (
              <Bar
                key={sev.label}
                dataKey={sev.label}
                stackId="logs"
                fill={sev.color}
                isAnimationActive={"auto"}
              />
            ))}
          </BarStack>
        </BarChart>
      </ResponsiveContainer>
      <LogHistogramLegend
        seen={seen}
        disabled={disabled}
        onToggle={handleToggle}
        onReset={handleReset}
        isDefaultState={isDefaultState}
      />
    </div>
  );
});
