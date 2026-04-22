# LogHistogram component — implementation spec

## Purpose

A React component that visualises log event counts over time as a stacked bar chart, with one bar segment per severity level. Users can toggle individual severity levels on and off directly from the legend.

---

## Dependencies

| Package | Version | Role |
|---|---|---|
| `react` | ^19.2 | Component runtime, hooks |
| `recharts` | ^2.13 | Chart primitives (SVG-based) |
| `lib/logs/histogram.util` | internal | `toHistogramBuckets()` — aggregates `LogRecord[]` into `HistogramBucket[]` |

No additional charting or utility libraries are required.

---

## Data model

### Input — `LogRecord` (from `lib/logs/types.ts`)

Each record is an OTLP log event normalised by `transform()`.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique record identifier |
| `timestamp` | `Date` | Yes | JavaScript `Date` object parsed from OTLP `timeUnixNano` |
| `severityNumber` | `SeverityNumber` | Yes | OTLP severity enum (0–24). Mapped to `SeverityBand` via `deriveSeverityText()` |
| `body` | `string` | Yes | Log message text |
| `attributes` | `Record<string, string>` | Yes | Merged resource + scope + record attributes |

The component accepts `records: LogRecord[]` and calls `toHistogramBuckets(records)` internally via `useMemo`.

### Transformed — `HistogramBucket`

`toHistogramBuckets()` produces one bucket per calendar day in the range `[earliest record, latest record]`. Buckets without any records are emitted with zero counts (no gaps in chart). Each bucket is a plain object with a mandatory `time` key plus one numeric key per severity present.

| Field | Type | Required | Description |
|---|---|---|---|
| `time` | `string` | Yes | ISO date label `"YYYY-MM-DD"` for the day bucket. Rendered as-is on the X axis. |
| `[severity: string]` | `number` | At least one | Count of records for that severity in this bucket. Omitting a severity key is equivalent to zero. |

Severity keys are lowercase `SeverityBand` values: `"unspecified"`, `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`. Produced by `deriveSeverityText(record.severityNumber).toLowerCase()` (from `lib/logs/severity.util.ts`).

### `SeverityConfig`

Defines the canonical display order and color for each known severity level. Unknown severities fall back to a neutral gray.

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Lowercase severity name |
| `color` | `string` | Valid CSS color string |
| `order` | `number` | Stack order (lower = bottom of bar) |

---

## `toHistogramBuckets` utility

**File**: `lib/logs/histogram.util.ts`

```
toHistogramBuckets(records: LogRecord[]): HistogramBucket[]
```

**Bucket size**: fixed 1 day (`DAY_MS = 24 * 60 * 60 * 1000`).

**Range**: derived from `min`/`max` of `record.timestamp.getTime()` across all records. Returns `[]` for empty input.

**Algorithm**:
1. Find `minTs` and `maxTs` by iterating records once.
2. `startDay = Math.floor(minTs / DAY_MS) * DAY_MS`
3. `endDay = Math.floor(maxTs / DAY_MS) * DAY_MS`
4. Pre-build an ordered map keyed by `bucketTs` (epoch ms) for every day in `[startDay, endDay]` with label `new Date(d).toISOString().slice(0, 10)`.
5. For each record: compute `bucketTs`, call `deriveSeverityText(record.severityNumber).toLowerCase()`, increment count in that bucket's entry.
6. Convert map values to array (already ascending by construction).

**Imports**: `deriveSeverityText` from `lib/logs/severity.util.ts`, `LogRecord` from `lib/logs/types.ts`.

---

## Component interface

### `LogHistogram` props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `records` | `LogRecord[]` | Yes | — | Raw log records. Aggregated internally via `toHistogramBuckets`. |
| `severityConfig` | `SeverityConfig[]` | No | See defaults below | Override colors and stack order. |
| `height` | `number` | No | `320` | Chart height in px. Width is always 100% of the container. |
| `xAxisLabel` | `string` | No | `"Date"` | Label rendered below the X axis. |
| `yAxisLabel` | `string` | No | `"Count"` | Label rendered beside the Y axis. |
| `defaultDisabled` | `string[]` | No | `[]` | Severity keys that start toggled off. |
| `onToggle` | `(key: string, disabled: boolean) => void` | No | — | Called whenever a severity is toggled in the legend. |
| `tooltipFormatter` | `(value: number, key: string) => string` | No | — | Custom label formatter for the tooltip. Receives the count and severity key. |

### Default `severityConfig`

Derived from `SEVERITY_META` in `lib/logs/severity.util.ts`. Hex values are Tailwind 4 palette equivalents.

| Key | Color (hex) | Tailwind class | Order |
|---|---|---|---|
| `unspecified` | `#71717a` | `text-zinc-500` | 0 (bottom) |
| `trace` | `#a1a1aa` | `text-zinc-400` | 1 |
| `debug` | `#60a5fa` | `text-blue-400` | 2 |
| `info` | `#4ade80` | `text-green-400` | 3 |
| `warn` | `#fbbf24` | `text-amber-400` | 4 |
| `error` | `#f87171` | `text-red-400` | 5 |
| `fatal` | `#fca5a5` | `text-red-300` | 6 (top) |

---

## Derived state

The following values are computed internally and must not be passed as props.

**`data: HistogramBucket[]`** — `useMemo(() => toHistogramBuckets(records), [records])`.

**`severities: string[]`** — derived once from `data` via `useMemo`. Collects all severity keys present across all buckets (excluding `"time"`), then sorts them by `order` from `severityConfig`. Keys not found in `severityConfig` are appended at the end in the order they were first encountered.

**`disabled: Set<string>`** — local `useState`. Initialised from `defaultDisabled`. Mutated only by `toggle()`.

**`activeSeverities: string[]`** — `severities` filtered by `disabled`. Drives which `<Bar>` components are mounted.

---

## Behaviour

### Severity derivation

The full list of severities shown in the legend is derived from the dataset, not from `severityConfig`. If a bucket contains a key not present in `severityConfig`, it appears in the legend and chart using the fallback color (`#CCCCCC`). The legend always reflects exactly what is in the data.

### Toggle

Clicking a legend item calls `toggle(key)`, which adds the key to `disabled` if absent or removes it if present. The corresponding `<Bar>` is unmounted from the chart. The Y axis rescales automatically because Recharts recalculates domain from mounted bars only.

A toggled-off legend item remains visible in the legend but renders with reduced opacity (`0.35`) and a hollow swatch (transparent fill, colored border). This communicates that the severity exists in the data but is currently excluded from the view.

The `onToggle` prop callback fires after each state update with the affected key and its new disabled status.

### Stacking

All active `<Bar>` components share the same `stackId`. The stack order follows `SeverityConfig.order` (ascending = bottom to top), so `unspecified` sits at the base and `fatal` at the top.

### Animation

`isAnimationActive` is set to `false` on all bars. This prevents unnecessary re-animations on data polling updates and keeps performance predictable for high-frequency log streams.

### Responsiveness

The chart is wrapped in `<ResponsiveContainer width="100%" height={height}>`. Width always fills the parent container. The consumer is responsible for sizing the parent.

---

## Sub-components

### `LogHistogramLegend`

A controlled sub-component rendered via `<Legend content={...}>`. It is not exported publicly.

Responsibilities:
- Iterates over `severities` (the full derived list, not `activeSeverities`) so all known severities are always shown.
- Renders a colored swatch and uppercase label per item.
- Applies disabled styling when the key is in `disabled`.
- Calls `toggle(key)` on click.

### `LogHistogramTooltip`

Uses Recharts' built-in `<Tooltip>` with custom `formatter` and `labelFormatter`. If `tooltipFormatter` is provided via props, it delegates to it. Otherwise, the default renders the severity key in uppercase and its count.

---

## Usage in `app/logs/page.tsx`

The component is placed between `<FilterBar />` and `<LogTable>` in the logs page:

```tsx
<FilterBar />
<div className="mt-4">
  <LogHistogram records={records} />
</div>
<div className="mt-4">
  <LogTable records={records} />
</div>
```

---

## Pre-conditions

- `records` is a `LogRecord[]` produced by `transform()` from `lib/logs/transform.ts`.
- All `record.timestamp` values are valid `Date` objects.
- All `record.severityNumber` values are valid OTLP `SeverityNumber` enum members.
- `severityConfig`, if provided, contains no duplicate `key` values.
- `defaultDisabled` contains only keys that appear in the data; unknown keys are silently ignored.
- The parent container has a defined, non-zero width before the component mounts.

---

## Post-conditions

- The chart renders one stacked bar per calendar day in the range `[earliest record, latest record]`.
- Days with no records render as zero-height bars (no gaps).
- Only severity levels present in the data appear in the legend and as bar segments.
- Severities are stacked bottom-to-top in ascending `order` from `severityConfig`.
- Toggling a severity removes its bar segment from the chart and dims its legend entry; the Y axis adjusts to the remaining visible data.
- Toggling a severity back on restores its bar segment at the same stack position.
- `onToggle` has been called once for each toggle action, with the correct key and disabled state.
- At minimum one severity must remain visible at all times; if the user attempts to disable the last active severity, the toggle is a no-op and no state change occurs.

---

## Error and edge cases

| Scenario | Expected behaviour |
|---|---|
| `records` is an empty array | `toHistogramBuckets` returns `[]`. Renders axes and legend with no bars. No error thrown. |
| All records on the same day | Single bar rendered. |
| All severities disabled | The last active severity cannot be disabled (no-op on toggle). |
| Bucket missing a severity key | Recharts treats missing keys as zero. No placeholder bar segment is rendered. |
| Severity key not in `severityConfig` | Rendered with fallback color `#CCCCCC`, appended at top of stack. |
| `height` prop is zero or negative | Defaults to `320`. |

---

## Accessibility

- The `<Legend>` items are keyboard-focusable (`tabIndex={0}`) and respond to `Enter` and `Space` as click equivalents.
- Each legend item has an `aria-pressed` attribute reflecting its current enabled/disabled state.
- The chart container has `role="img"` with an `aria-label` summarising the date range and total record count.

---

## Out of scope

- Fetching or polling log data from any API.
- Zooming, brushing, or panning the time range.
- Rendering log messages or drilling into individual events.
- Dark mode color theming (consumers should provide appropriate `severityConfig` colors).
- Sub-day bucket granularity (fixed at 1 day; variable bucket size is a future enhancement).
