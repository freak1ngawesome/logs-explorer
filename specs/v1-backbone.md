# OTLP Log Viewer — Feature Spec v1.9

## Status: Draft

## Scope: Log List View (v1)

## Stack: Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind CSS · shadcn/ui · Vercel

### Changelog

- v1.9 — Added §15 (Iteration 1.9): Resource column (service.name + service.namespace badges). Open decisions → §16.
- v1.8 — Added §14 (Iteration 1.8): column sorting for Severity and Time. Moved open decisions to §15.
- v1.5 — Added §0 (agent execution guide). Retired separate AGENT.md.
- v1.4 — Revised §3.6 LogStats model. Stripped implementation detail from §4–§6.
- v1.3 — Verified against Next.js 15 / Vercel docs.
- v1.2 — Added sidebar, page header, dark theme.
- v1.1 — Added shadcn/ui, @tanstack/react-table, Tailwind.
- v1.0 — Initial draft.

---

## 0. How to use this spec

This document is the single source of truth for both design decisions and
agent execution. Read it fully before writing any file.

### 0.1 What this spec provides

- **§1–§2** — Goals, constraints, and dependencies. Establishes what is in
  and out of scope and what packages are permitted.
- **§3–§5** — Data layer contracts. Exact transformation rules, type
  definitions, function signatures, and postconditions. These are
  authoritative — do not invent behaviour not described here.
- **§6** — UI component responsibilities and structure. Describes _what_
  each component does and how it is composed, not _how_ to implement it.
  Fill in implementation details (state, hooks, class names) from the
  behaviour described.
- **§7** — File structure. Every file to be created is listed here. Do not
  create files outside this structure.
- **§8** — Mock data contract. The payload to use verbatim.
- **§9** — Correctness criteria. These are your acceptance tests. The build
  is complete when every item is satisfied.
- **§10–§11** — Theme constraints and deferred decisions. Do not implement
  anything listed in §11.

### 0.2 Build order

Follow the dependency graph — each phase must compile cleanly before the
next begins. Run `npx tsc --noEmit` after every phase and fix all errors
before continuing.

```
Phase 1 — Data foundation
  lib/logs/types.ts
  lib/logs/anyValue.util.ts        + anyValue.util.test.ts
  lib/logs/logRecord.util.ts       + logRecord.util.test.ts
  lib/logs/severity.util.ts        + severity.util.test.ts
  lib/logs/format.util.ts          + format.util.test.ts
  lib/logs/stats.util.ts           + stats.util.test.ts
  lib/logs/accordionExpanded.ts
  lib/logs/transform.ts
  lib/mock/otlpPayload.ts

Phase 2 — API route
  app/api/logs/route.ts

Phase 3 — UI atoms (no inter-dependencies, any order)
  components/shared/SeverityPill.tsx
  components/logs/LogRowExpanded.tsx
  components/logs/LogTableSkeleton.tsx

Phase 4 — Table
  components/logs/LogTable.tsx

Phase 5 — Shell components
  components/shared/FilterBar.tsx
  components/shared/LogViewerShell.tsx
  components/shared/RetryButton.tsx
  components/shared/AppSidebar.tsx
  components/logs/LogsPageHeader.tsx

Phase 6 — Pages
  app/layout.tsx
  app/page.tsx                     (redirect to /logs)
  app/logs/loading.tsx
  app/logs/page.tsx
```

### 0.3 Hard constraints

These apply to every file without exception:

- Do not install packages not listed in §2
- Do not modify any file under `components/ui/` — extend via `className` only
- Do not add `"use client"` to any file not explicitly marked as a Client
  Component in §6
- Do not use `localStorage`, `sessionStorage`, or any browser storage API
- Do not call `getUserTimezone()` outside a client-side mount effect
- Do not use `any` — use `unknown` and narrow, or the correct OTLP type
- Do not implement anything listed in §11 (open decisions)
- Do not create files not listed in §7

### 0.4 Acceptance

The build is complete when every item in §9 is satisfied. Items that
reference specific counts (46 records, 6 warn, 6 error, 7 fatal) are
derived from the mock payload in §8 — verify against it, not from memory.

---

## 1. Goals & Non-goals

### Goals

- Fetch OTLP log records from a REST endpoint and display them in a scannable table
- Allow engineers to drill into full log attributes via expandable rows
- Present severity visually using domain-standard color conventions
- Provide a layout that anticipates search/filter and future histogram/group-by panels

### Non-goals (v1)

- No search or filter (UI space reserved — see §6.5)
- No histogram
- No group-by-service view
- No real-time polling or streaming
- No authentication
- No light/dark theme toggle (dark only — see §10)

---

## 2. Dependencies

### OTEL packages

Use opentelemetry-proto repo to generate typings - no npm packages

### UI packages

| Package                 | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `tailwindcss`           | Utility-first styling throughout             |
| `shadcn/ui`             | Component primitives — full list in §2.1     |
| `@tanstack/react-table` | Headless table logic (log table only)        |
| `lucide-react`          | Icons: `ScrollText`, `Clock`, `ChevronRight` |

### 2.1 shadcn components to install

| Component   | Used by                                         |
| ----------- | ----------------------------------------------- |
| `sidebar`   | `AppSidebar`                                    |
| `badge`     | `SeverityPill`                                  |
| `button`    | `RetryButton`, `TimeRangeSelector`, row chevron |
| `skeleton`  | `LogTableSkeleton`, `loading.tsx`               |
| `table`     | `LogTable` rendering layer                      |
| `input`     | `FilterBar` placeholder                         |
| `alert`     | Error state in `page.tsx`                       |
| `separator` | `TimeRangeSelector` divider                     |
| `tooltip`   | Sidebar collapsed-state item labels             |

### Constraints

- No OTEL SDK collector or exporter packages — this app is a consumer only
- No additional state management libraries
- shadcn components live in `components/ui/` — do not modify generated files
- `@tanstack/react-table` is used for the log table only

---

## 3. Data layer

### 3.1 API endpoint

**Route:** `GET /api/logs`
**File:** `app/api/logs/route.ts` (Next.js Route Handler)
**Behaviour:** Returns the static mock payload. No query parameters in v1.

**Caching:** GET Route Handlers are uncached by default in Next.js 15. No
explicit cache configuration needed.

**OTLP wire types** (from `@opentelemetry/otlp-transformer`):

```typescript
import {
  ExportLogsServiceRequest,
  ResourceLogs,
  LogRecord,
} from "@opentelemetry/otlp-transformer";
```

**Response shape** — actual wire format as present in the mock payload:

```
ExportLogsServiceRequest
└── resourceLogs: ResourceLogs[]
    ├── resource
    │   ├── attributes[]             { key, value: AnyValue }
    │   └── droppedAttributesCount   ignored by transform
    └── scopeLogs[]
        ├── scope
        │   ├── name
        │   ├── attributes[]         { key, value: AnyValue }
        │   └── droppedAttributesCount  ignored by transform
        └── logRecords: LogRecord[]
            ├── timeUnixNano
            ├── observedTimeUnixNano
            ├── severityNumber
            ├── severityText
            ├── body: AnyValue
            ├── attributes[]         { key, value: AnyValue }
            ├── droppedAttributesCount  ignored by transform
            ├── traceId              optional — absent in mock data
            └── spanId               optional — absent in mock data
```

### 3.2 Data transformation

**File:** `lib/logs/transform.ts`
**Function:** `transform(payload: ExportLogsServiceRequest): LogRecord[]`

Iterates `resourceLogs → scopeLogs → logRecords`, producing one `LogRecord`
per `LogRecord`.

**Transformation rules:**

| Source                     | Target field     | Rule                                                                                                                                                                                             |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `logRecord.timeUnixNano`   | `timestamp`      | Nanosecond string → `Date`. Use `BigInt` division to avoid float precision loss. Fall back to `observedTimeUnixNano` if absent or `"0"`. Delegated to `parseTimestamp()` in `logRecord.util.ts`. |
| `logRecord.severityNumber` | `severityNumber` | Pass through as `number`; default to `0` if absent                                                                                                                                               |
| `logRecord.severityText`   | `severityText`   | Uppercase. Derive from `severityNumber` if absent (§3.4).                                                                                                                                        |
| `logRecord.body`           | `body`           | `anyValueToString(body)` — see §3.5                                                                                                                                                              |
| `resource.attributes`      | `attributes`     | Flatten; prefix each key with `resource.`                                                                                                                                                        |
| `scope.name`               | `attributes`     | Add as `scope.name` if non-empty                                                                                                                                                                 |
| `scope.version`            | `attributes`     | Add as `scope.version` if present and non-empty                                                                                                                                                  |
| `scope.attributes`         | `attributes`     | Flatten; prefix each key with `scope.`                                                                                                                                                           |
| `logRecord.attributes`     | `attributes`     | Flatten; no prefix                                                                                                                                                                               |
| `logRecord.traceId`        | `attributes`     | Add as `trace_id` if non-empty                                                                                                                                                                   |
| `logRecord.spanId`         | `attributes`     | Add as `span_id` if non-empty                                                                                                                                                                    |
| `*.droppedAttributesCount` | —                | **Ignored everywhere.** Must not appear in `attributes`.                                                                                                                                         |

**Key collision:** log record attribute wins over resource attribute for the
same unprefixed key. The `resource.`-prefixed copy is always preserved.

**`id` construction:** `${resourceIndex}-${scopeIndex}-${recordIndex}` using
zero-based positions within each parent array. Delegated to
`buildId()` in `logRecord.util.ts`.

**Postconditions:**

- Every `LogRecord` has a non-null, valid `timestamp`
- Every `LogRecord` has a non-empty `severityText`
- `body` is always a string (may be `""`)
- `attributes` is `Record<string, string>` — no nested objects, no `droppedAttributesCount` key

### 3.3 App-internal type

**File:** `lib/logs/types.ts`

```typescript
export interface LogRecord {
  id: string;
  timestamp: Date;
  severityNumber: number;
  severityText: string;
  body: string;
  attributes: Record<string, string>;
}
```

### 3.4 Severity text derivation

Uses `SeverityNumber` from `@opentelemetry/api` for band boundaries:

| severityNumber   | Derived text    |
| ---------------- | --------------- |
| 1 – 4            | `"TRACE"`       |
| 5 – 8            | `"DEBUG"`       |
| 9 – 12           | `"INFO"`        |
| 13 – 16          | `"WARN"`        |
| 17 – 20          | `"ERROR"`       |
| 21 – 24          | `"FATAL"`       |
| 0 / out of range | `"UNSPECIFIED"` |

### 3.5 AnyValue → string

**File:** `lib/logs/anyValue.util.ts`

| AnyValue field               | Serialisation           |
| ---------------------------- | ----------------------- |
| `stringValue`                | As-is                   |
| `intValue` / `doubleValue`   | `String(value)`         |
| `boolValue`                  | `"true"` / `"false"`    |
| `arrayValue` / `kvlistValue` | `JSON.stringify(value)` |
| absent / null                | `""`                    |

Must not throw for any input.

### 3.6 Log stats computation

**File:** `lib/logs/stats.util.ts`

`LogStats` is designed to anticipate a future dedicated totals endpoint that
will return system-wide counts independently of the records currently loaded
in the view. `displayed` is always derived from the loaded records; the
remaining fields are either passed in from that endpoint or, in v1, also
derived from loaded records.

```typescript
export interface TotalsFromEndpoint {
  total: number;
  warn: number;
  error: number;
  fatal: number;
}

export interface LogStats {
  total: number; // system-wide total — from totals endpoint when available; v1: equals displayed
  displayed: number; // count of records currently loaded in the view
  warn: number; // system-wide WARN count — from totals endpoint when available; v1: from loaded records
  error: number; // system-wide ERROR count
  fatal: number; // system-wide FATAL count
}

export function computeLogStats(
  displayed: LogRecord[],
  totals?: TotalsFromEndpoint,
): LogStats;
```

When `totals` is provided: use it for `total`, `warn`, `error`, `fatal`;
derive `displayed` from the array length.

When `totals` is absent (v1): derive all fields from `displayed`.

**Band membership** uses `severityNumber` ranges from §3.4 — not `severityText`
string matching.

---

## 4. Severity → visual mapping

**File:** `lib/logs/severity.util.ts`

### 4.1 Band resolution

Band is resolved from `severityNumber` using the ranges in §3.4. Never rely
on `severityText` string matching — it may be non-standard.

### 4.2 Colour scheme

Each severity band maps to a distinct dark-mode colour. The intent per band:

| Band        | Colour intent                                |
| ----------- | -------------------------------------------- |
| TRACE       | Muted gray — low signal, background noise    |
| DEBUG       | Muted blue — diagnostic, informational       |
| INFO        | Muted green — normal operation               |
| WARN        | Muted amber — attention warranted            |
| ERROR       | Muted red — something failed                 |
| FATAL       | Deep red — critical failure, highest urgency |
| UNSPECIFIED | Dimmer gray — unknown severity               |

Colors are dark-background tints with matching text and border — all within
the same hue family per band. No light-mode variants.

### 4.3 Exported function

```typescript
export function getSeverityMeta(severityNumber: number): {
  className: string; // Tailwind classes for Badge background, text, border
  label: string; // title-cased display label, e.g. "Info", "Warn"
};
```

`label` is the `severityText` value in title-case. Truncate to 11 characters
if longer. `getSeverityMeta` must return a defined result for all integer
inputs including 0 and out-of-range values.

---

## 5. Timestamp formatting

**File:** `lib/logs/format.util.ts`

### 5.1 formatTimestamp

**Signature:** `formatTimestamp(date: Date): string`

Output format: `"MMM DD HH:mm:ss.SSS"` in the browser's local timezone.
Example: `"Apr 19 14:32:01.445"`.

Rules: 3-letter English month abbreviation; day zero-padded to 2 digits;
time zero-padded; milliseconds always 3 digits; no year; no timezone suffix.
Uses local timezone via `Date` getter methods (getHours, getDate, etc.).
Pure function, no locale-sensitive formatting. Unit-testable.

### 5.2 getUserTimezone

**Signature:** `getUserTimezone(): string`

Returns the browser's IANA timezone string via `Intl.DateTimeFormat`.
Must only be called client-side — callers are responsible for invoking it
inside a mount effect. Not unit-testable (browser API).

---

## 6. UI components

### 6.1 Page structure

```
app/layout.tsx
├── <html class="dark">
└── SidebarProvider
    ├── AppSidebar                 ← fixed left, collapsible
    └── content column
        ├── PageHeader             ← sticky, page-specific, receives LogStats
        └── LogViewerShell         ← scroll container — owns content area below header
            ├── FilterBar
            └── LogTable
```

`SidebarProvider` wraps the entire body so the sidebar context is available
to any component in the tree. `LogViewerShell` is the semantic boundary
between the sticky header and the scrollable content — shared across all
pages, each page supplies its own `PageHeader` variant.

### 6.2 Component tree

```
app/
└── layout.tsx                     Server Component — dark class, SidebarProvider, AppSidebar
    ├── AppSidebar
    └── logs/
        └── page.tsx               Server Component — fetch, transform, stats
            ├── LogsPageHeader     Client Component — receives LogStats
            └── LogViewerShell
                ├── FilterBar
                └── LogTable       Client Component — receives LogRecord[]
```

### 6.3 App layout (`app/layout.tsx`)

Server Component. Responsibilities:

- Apply `"dark"` class to `<html>` — this is the sole theming mechanism
- Wrap `<body>` in `SidebarProvider`
- Render `AppSidebar` and `{children}` side by side in a full-height flex container

### 6.4 LogsPage (`app/logs/page.tsx`)

Server Component. Responsibilities:

- Fetch `GET /api/logs` — no cache option needed (Next.js 15 default is uncached)
- Call `transform(payload)` → `LogRecord[]`
- Call `computeLogStats(records)` → `LogStats`
- Pass `stats` to `LogsPageHeader` and `records` to `LogTable`
- On fetch or transform error: render a destructive `Alert` with a `RetryButton`

**Loading state** (`app/logs/loading.tsx`):
Next.js automatically wraps `page.tsx` in a Suspense boundary using this file.
It accepts no props. Renders pulsing skeleton placeholders that match the
height of the real `LogsPageHeader` and table rows — no values, no counts.
`AppSidebar` is in `layout.tsx` and remains visible during loading.

### 6.5 FilterBar (`components/shared/FilterBar.tsx`)

Server Component. Renders a disabled `Input` placeholder with text
"Search logs…". Accepts a `children` prop; renders `children` instead of
the placeholder when provided. This slot is reserved for future search and
filter controls. Shared across all pages.

### 6.6 LogViewerShell (`components/shared/LogViewerShell.tsx`)

Server Component. Scroll container that fills available height below the
sticky header and clips overflow. Renders `{children}`. Shared across all
pages — each page supplies its own header and content.

### 6.7 LogTable (`components/logs/LogTable.tsx`)

Client Component. Receives `records: LogRecord[]`.

Uses `@tanstack/react-table` for all table state and logic. Uses shadcn
`Table` primitives (`Table`, `TableHeader`, `TableBody`, `TableRow`,
`TableHead`, `TableCell`) for the rendered markup.

**Columns:**

| Column   | Width                                         | Content                                       |
| -------- | --------------------------------------------- | --------------------------------------------- |
| Severity | `min-content` — sized to the widest pill      | `SeverityPill`                                |
| Time     | `min-content` — sized to the timestamp string | `formatTimestamp` result, monospace           |
| Resource | flexible, max `1fr`                           | `service.name` and `service.namespace` badges |
| Body     | fills all remaining width                     | Body text (up to 3 lines) + expand chevron    |

Severity and Time use `width: auto` / `whitespace-nowrap` — shrink to content.
Resource is flexible (no `whitespace-nowrap`), up to `1fr` of available space.
Body absorbs all leftover space.

**Resource cell:** Vertical stack (`flex flex-col gap-1`) of up to two shadcn
`Badge` components (variant `"secondary"`). Each badge renders a key–value
label where the key prefix is muted: `<span class="text-muted-foreground">service.name:</span><value>`.
Source attributes: `attributes["resource.service.name"]` and
`attributes["resource.service.namespace"]` — display label strips the
`resource.` prefix. A badge is omitted when its attribute is absent.
Cell is empty when both attributes are absent.

**Body cell:** Flex row — body text on the left clamped to 3 lines
(`line-clamp-3`), with a native tooltip showing the full text on hover, and
a ghost icon button with a chevron on the right. The chevron is top-aligned
within the cell so it stays anchored when the body wraps across multiple lines.

**Row interaction:** Clicking anywhere on a row toggles its expanded state.
The chevron button also toggles expansion and prevents the click from
propagating to the row handler.

**Expansion behaviour (accordion):** At most one row may be expanded at a
time. Opening a new row closes the currently open one. This constraint is
enforced by a custom `onExpandedChange` handler (`lib/logs/accordionExpanded.ts`)
that wraps TanStack's expansion state setter.

**Expanded row:** Rendered as a second `<TableRow>` immediately below the
data row, spanning all columns, containing `LogRowExpanded`.

**Header row:** Sticky — remains visible when the table scrolls.

**Empty state:** When `records` is empty, a single full-width cell displays
"No log records found."

### 6.8 LogTableSkeleton (`components/logs/LogTableSkeleton.tsx`)

Server Component. Renders the same shadcn `Table` chrome as `LogTable` with
three skeleton rows. Each row contains pill-shaped, rectangle, and
full-width `Skeleton` placeholders corresponding to the severity, time,
and body columns respectively.

### 6.9 SeverityPill (`components/shared/SeverityPill.tsx`)

Server Component. Props: `severityNumber: number`, `severityText: string`.

Renders a shadcn `Badge` using `getSeverityMeta(severityNumber)` for
colour classes and label. Fixed width so pills align across all rows.
Uses `font-mono` and a small font size — consistent with observability
tooling conventions. Placed in `shared/` because traces also carry
severity levels and will reuse this component.

### 6.10 LogRowExpanded (`components/logs/LogRowExpanded.tsx`)

Server Component. Props: `record: LogRecord`.

Renders inside the expanded `TableCell`. Two sections:

**Trace context summary** (conditional — rendered only when `trace_id` or
`span_id` is present in `record.attributes`): Displays `trace_id` and
`span_id` values prominently above the attribute grid. These keys also
remain in the grid below.

**Attribute grid:** Two-column key–value layout. Keys are right-aligned,
monospace, muted. Values are left-aligned, `break-all`. Entries sorted
alphabetically by key. Alternating row backgrounds for scannability.
When `attributes` is empty: displays "No attributes" in muted text.

Not a shadcn `Table` — uses a plain CSS grid layout.

### 6.11 AppSidebar (`components/shared/AppSidebar.tsx`)

Server Component. Sidebar open/close state is owned by `SidebarProvider`
context — no local state needed.

Structure:

```
Sidebar [collapsible="icon"]
├── SidebarHeader
│   └── SidebarTrigger              ← toggle button, no custom logic
└── SidebarContent
    └── SidebarMenu
        └── SidebarMenuItem
            └── SidebarMenuButton [isActive, tooltip="Log Explorer"]
                ├── ScrollText icon
                └── "Log Explorer" label  → href="/logs"
```

`collapsible="icon"` — shadcn hides labels and shrinks to icon-only width
when collapsed. No custom hide/show logic.

`tooltip="Log Explorer"` — shadcn renders this automatically as a `Tooltip`
in collapsed state.

`isActive` — hardcoded `true` for the Log Explorer item in v1 (only one
route exists). Future pages add their own `SidebarMenuItem` entries here.

`SidebarTrigger` — shadcn-provided; do not implement a custom toggle.

### 6.12 LogsPageHeader (`components/logs/LogsPageHeader.tsx`)

Client Component (needed for `getUserTimezone()` on mount).
Props: `stats: LogStats`.

Page-specific header for the Log Explorer. Each future page (Traces,
Metrics) will have its own `PageHeader` variant in its own subfolder.

Sticky horizontal bar across the top of the content column. Two regions:

**Left — title and stats line:**

Title: "Log Explorer" as a small heading.

Stats line below the title:

- "Showing {stats.displayed} logs out of {stats.total}"
- Followed by severity chips (warn · error · fatal), separated by muted dots
- Each chip renders as plain coloured text: amber for warn, red for error,
  brighter red for fatal
- A chip is only rendered when its count is greater than zero
- When all counts are zero nothing is rendered after the showing text

**Right — time range selector:**

A visually disabled button (non-interactive in v1) containing:

- Clock icon
- "Last 30 minutes" label
- Vertical separator
- User's local timezone string (read on mount to avoid SSR hydration mismatch)

### 6.13 RetryButton (`components/shared/RetryButton.tsx`)

Client Component. Renders a small outline `Button` labelled "Retry" that
calls `router.refresh()` on click. Used in the error state of `page.tsx`.

---

## 7. File structure

```
app/
  layout.tsx                        Root layout — dark class, SidebarProvider, AppSidebar
  page.tsx                          Redirects to /logs

  logs/                             Log Explorer route
    page.tsx                        Server Component — fetch, transform, stats, render
    loading.tsx                     Skeleton loading state (no props)

  traces/                           Future — placeholder route only
    page.tsx
    loading.tsx

  metrics/                          Future — placeholder route only
    page.tsx
    loading.tsx

  api/
    logs/
      route.ts                      GET /api/logs — returns mock payload

components/
  ui/                               shadcn generated — do not modify
    badge.tsx
    button.tsx
    skeleton.tsx
    table.tsx
    input.tsx
    alert.tsx
    sidebar.tsx
    separator.tsx
    tooltip.tsx

  shared/                           Reusable across all pages
    AppSidebar.tsx
    FilterBar.tsx
    LogViewerShell.tsx
    SeverityPill.tsx                Used by logs today; anticipates traces
    RetryButton.tsx                 Client Component
    SortableHeader.tsx              Client Component — sortable column header button

  logs/                             Log Explorer page components
    LogTable.tsx                    Client Component
    LogTableSkeleton.tsx
    LogRowExpanded.tsx
    LogsPageHeader.tsx              Client Component

lib/
  logs/
    types.ts                        LogRecord interface
    transform.ts                    ExportLogsServiceRequest → LogRecord[]
    accordionExpanded.ts            onExpandedChange factory (React-coupled, no unit tests)

    anyValue.util.ts                anyValueToString()
    anyValue.util.test.ts

    logRecord.util.ts               buildId(), parseTimestamp()
    logRecord.util.test.ts

    severity.util.ts                getSeverityMeta(), deriveSeverityText()
    severity.util.test.ts

    format.util.ts                  formatTimestamp(), getUserTimezone()
    format.util.test.ts             formatTimestamp() only — getUserTimezone() is browser-only

    stats.util.ts                   LogStats, TotalsFromEndpoint, computeLogStats()
    stats.util.test.ts

  mock/
    otlpPayload.ts                  ExportLogsServiceRequest literal (provided payload)
```

---

## 8. Mock data contract

**File:** `lib/mock/otlpPayload.ts`
**Type:** `ExportLogsServiceRequest`

The provided JSON payload is used verbatim. Do not invent or modify records.
Export a single typed constant of type `ExportLogsServiceRequest`.

**Payload characteristics:**

| Property                 | Value                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Resource blocks          | 10                                                                                                |
| Total log records        | 46                                                                                                |
| Services                 | `port`, `feed`, `sensor`, `capacitor`, `bandwidth`, `interface`, `bus`, `card`, `array`, `system` |
| Severity bands present   | TRACE, DEBUG, INFO, WARN, ERROR, FATAL, UNSPECIFIED                                               |
| WARN count               | 6                                                                                                 |
| ERROR count              | 6                                                                                                 |
| FATAL count              | 7                                                                                                 |
| Log-level attributes     | None — all `logRecords[].attributes` are empty arrays                                             |
| `traceId` / `spanId`     | Absent on all records                                                                             |
| `scope.attributes`       | Present on all scopes: `telemetry.sdk.name`, `telemetry.sdk.language`, `telemetry.sdk.version`    |
| `droppedAttributesCount` | Present on resource, scope, and logRecord — always `0`                                            |
| Body                     | All records have non-empty string bodies                                                          |
| `severityText`           | Present on all records                                                                            |

**Expected `attributes` per transformed record** (no log-level attributes in source):

```
resource.service.namespace      e.g. "large language models"
resource.service.name           e.g. "port"
resource.service.version        e.g. "9.0.11"
scope.name                      "mock"
scope.telemetry.sdk.name        "dash0-take-home-assignment"
scope.telemetry.sdk.language    "nodejs"
scope.telemetry.sdk.version     "1.0.0"
```

**Edge-case coverage note:** The `severityText` derivation fallback and
trace context row are not exercised by this dataset. Both paths must still
be implemented — they simply will not be visible in the running app with
this mock.

---

## 9. Correctness criteria

### Data layer

- [x] `transform()` never throws for any valid `ExportLogsServiceRequest`
- [x] Output record count equals total `logRecords` across all resourceLogs/scopeLogs (41 for the provided mock)
- [x] All `LogRecord.id` values are unique within a result array
- [x] `timestamp` is never `null` or `Invalid Date`
- [x] `severityText` is never empty
- [x] `attributes` contains `resource.*`, `scope.*` (from both `scope.name` and `scope.attributes`), and log-record-level keys
- [x] `droppedAttributesCount` does not appear as a key in any `LogRecord.attributes`
- [x] `scope.attributes` keys appear prefixed with `scope.` (e.g. `scope.telemetry.sdk.name`)
- [x] `getSeverityMeta()` returns a defined result for all integers including 0 and out-of-range
- [x] `computeLogStats()` band counts match the correct `severityNumber` ranges from §3.4
- [x] `computeLogStats(records)` with no `totals` argument sets `total` equal to `displayed`
- [x] `computeLogStats(records, totals)` with a `totals` argument uses those values for `total`, `warn`, `error`, `fatal`
- [x] Each `*.util.ts` has a corresponding `*.util.test.ts` covering its public functions
- [x] `getUserTimezone()` has no unit test — explicitly excluded from `format.util.test.ts`

### App shell

- [x] `<html>` carries `class="dark"` in the rendered DOM
- [x] `SidebarProvider` wraps the full app in `layout.tsx`
- [x] `app/page.tsx` redirects to `/logs`
- [x] `app/logs/loading.tsx` renders pulsing skeleton placeholders only — no text values
- [x] Loading skeleton height matches real `LogsPageHeader` height — no layout shift on resolve
- [x] `getUserTimezone()` is not called during server render — no hydration mismatch

### AppSidebar

- [x] Expanded: icon and "Log Explorer" label both visible
- [x] Collapsed: icon only; "Log Explorer" tooltip appears on hover
- [x] `SidebarTrigger` toggles state without custom logic
- [x] "Log Explorer" item always renders as active in v1

### LogsPageHeader

- [x] "Log Explorer" heading visible in the header
- [x] Stats line: "Showing {displayed} logs out of {total}"
- [x] Severity chips render only when count > 0
- [x] warn chip is amber, error is red, fatal is brighter red
- [x] Time range button is visually disabled
- [x] Time range button shows Clock icon, "Last 30 minutes", separator, local timezone
- [x] Timezone string is non-empty after mount
- [x] Header remains visible when table scrolls

### Table

- [x] 41 rows rendered from the provided mock
- [x] Severity column width matches the widest pill — no fixed pixel width
- [x] Time column width matches the timestamp string — no fixed pixel width
- [x] Body column fills all remaining row width
- [x] Severity pill: correct colour per band, fixed width, aligned across rows
- [x] Timestamp: local timezone, `"YYYY-MM-DD HH:mm:ss.SSS"`, monospace
- [x] Body cell clamps to 3 lines maximum; full text accessible via native tooltip
- [x] Chevron is top-aligned in the body cell when body wraps to multiple lines
- [x] Clicking a row expands it; clicking the same row collapses it
- [x] Clicking row B while row A is expanded: A collapses, B expands
- [x] Chevron rotates when expanded and returns on collapse
- [x] Header row stays visible during scroll

### Expanded row

- [x] Attributes sorted alphabetically
- [x] Keys muted and right-aligned; values normal weight with word-break
- [x] Alternating row backgrounds present
- [x] Trace context row absent (no traceId/spanId in mock data)
- [x] Empty attributes renders "No attributes"
- [x] Expanded cell spans all columns

### Error and edge cases

- [x] API failure: destructive Alert and RetryButton render; no uncaught exception
- [x] RetryButton triggers a page refresh
- [x] `records` empty: "No log records found." renders; `LogsPageHeader` shows "Showing 0 out of 0"
- [x] Record with empty `body`: row renders and expands without error
- [x] Record with absent `severityText`: badge shows derived label from `severityNumber`
- [x] Record with `severityNumber` outside 1–24: resolves to UNSPECIFIED band

---

## 10. Theme

**Dark mode only in v1.** No toggle, no `prefers-color-scheme` media query.

`tailwind.config.ts` uses `darkMode: "class"`. The `"dark"` class on `<html>`
is the sole theming mechanism — shadcn's CSS variables resolve to their dark
values under this selector.

All component colours must use shadcn CSS variable tokens (background,
foreground, muted, border, etc.) rather than hardcoded hex values.

**Exception:** Severity badge colours (§4.2) use explicit Tailwind dark-ramp
classes because severity colours are not part of the shadcn token set.

No component may use light-mode colour variants or rely on
`prefers-color-scheme`.

---

## 12. Iteration 1.6 — Changes

This section records what changed between iteration 1 and iteration 2.
Existing §9 criteria are already satisfied and must not regress.
New criteria below are the acceptance checklist for this iteration only.

### What changed

| #   | Change                                                       | Affected file                      |
| --- | ------------------------------------------------------------ | ---------------------------------- |
| 1   | Sidebar: 5 mock nav items added below Log Explorer           | `components/shared/AppSidebar.tsx` |
| 2   | Sidebar: user block added to `SidebarFooter`                 | `components/shared/AppSidebar.tsx` |
| 3   | Font: Roboto loaded via `next/font/google`, applied globally | `app/layout.tsx`                   |
| 4   | Table: clicking an already-expanded row must collapse it     | `components/logs/LogTable.tsx`     |

### What to leave untouched

Everything in `lib/` — the data layer is correct and tested. Do not
regenerate any `*.util.ts`, `*.util.test.ts`, `transform.ts`, or mock files.

All other components not listed in the table above are unchanged.

### New correctness criteria

#### Sidebar — mock nav items

- [x] Five items appear below Log Explorer;
- [x] Clicking any mock item does nothing — no navigation, no error
- [x] Expanded: icon and label visible for all items, consistent padding
- [x] Collapsed: icons only visible, no labels
- [x] All menu items have a same padding in close/open state
- [x] All menu items use shadcn Skeleton: circle icon and item label (50px)

#### Sidebar — user block

- [x] User block is pinned to the bottom of the sidebar via `SidebarFooter`
- [x] Expanded: avatar circle + placeholder name + placeholder org all visible
- [x] Collapsed: avatar circle only visible, name and org hidden
- [x] Avatar, name and org are shadcn Skeleton

#### Font

- [x] Roboto is loaded via `next/font/google` in `app/layout.tsx`
- [x] Font CSS variable is applied to `<body>` via `className`
- [x] No external font request at runtime — Next.js serves the font file

#### Table — row collapse

- [x] Clicking a currently expanded row collapses it (expanded state returns to closed)
- [x] The row does not re-expand immediately after collapsing (no double-toggle)

## 13. Iteration 1.7 — Changes

This section records what changed between iteration 1.6 and iteration 1.7.
Existing §9 and §12 criteria are already satisfied and must not regress.

### What changed

| #   | Change                                                    | Affected files                                                    |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Severity pill: remove Badge, use colored text + left pipe | `components/shared/SeverityPill.tsx`, `lib/logs/severity.util.ts` |
| 2   | Search bar: 100% width                                    | `components/shared/FilterBar.tsx`                                 |
| 3   | Table cells: consistent font and font size                | `components/logs/LogTable.tsx`                                    |
| 4   | Rename "Log Explorer" → "Logs" in sidebar menu item       | `components/shared/AppSidebar.tsx`                                |
| 5   | Rename page header "Log Explorer" → "Logs Explorer"       | `components/logs/LogsPageHeader.tsx`                              |
| 6   | Cell text selection guard via CellWrapper                 | `components/logs/CellWrapper.tsx`, `components/logs/LogTable.tsx` |
| 7   | Dark-themed scrollbar                                     | `app/globals.css`                                                 |
| 8   | Timestamp format: `MMM DD HH:mm:ss.SSS`                   | `lib/logs/format.util.ts`, `lib/logs/format.util.test.ts`         |

### New correctness criteria

#### Severity indicator

- [x] No `Badge` component used in `SeverityPill`
- [x] Severity renders as colored text with a vertical pipe on the left: `| Info`
- [x] Pipe colour matches text colour per severity band
- [x] Fixed width so indicators align across rows
- [x] Font is monospace, small size — consistent with previous pill

#### Search bar

- [x] `FilterBar` input is full width (100%), not `max-w-sm`

#### Table cell consistency

- [x] All three columns (severity, time, body) use same font family and font size
- [x] No column uses a different base font size than others

#### Naming

- [x] Sidebar menu item label reads "Logs" (not "Log Explorer")
- [x] Sidebar tooltip reads "Logs"
- [x] Page header heading reads "Logs Explorer"

#### Cell text selection

- [x] Selecting/clicking text inside body cell does NOT trigger row expand
- [x] Clicking empty space in row (outside cell text) DOES trigger row expand
- [x] Chevron button still toggles expand on click
- [x] `CellWrapper` component handles selection guard for all data cells

#### Scrollbar

- [x] Scrollbar styled to match dark theme — thin, dark track, muted thumb
- [x] Uses CSS custom scrollbar properties (`::-webkit-scrollbar` and `scrollbar-color`)
- [x] Applied globally in `app/globals.css`

#### Timestamp format

- [x] Format changed from `YYYY-MM-DD HH:mm:ss.SSS` to `MMM DD HH:mm:ss.SSS`
- [x] Month is 3-letter English abbreviation (Jan, Feb, … Dec)
- [x] Day is zero-padded to 2 digits
- [x] Uses browser local timezone (Date getter methods, not UTC)
- [x] Tests updated to match new format

## 14. Iteration 1.8 — Changes

This section records what changed between iteration 1.7 and iteration 1.8.
Existing §9, §12, and §13 criteria are already satisfied and must not regress.

### What changed

| #   | Change                                           | Affected files                     |
| --- | ------------------------------------------------ | ---------------------------------- |
| 1   | Column sorting for Severity and Time headers     | `components/logs/LogTable.tsx`     |

### What to leave untouched

Everything in `lib/` — the data layer is correct and tested. All other components not listed above.

### Implementation checklist

- [ ] Create `components/shared/SortableHeader.tsx`
- [ ] Add `getSortedRowModel` to `@tanstack/react-table` imports in `LogTable.tsx`
- [ ] Remove custom `SortState` interface, `sortState` useState, `handleSortClick` useCallback, and `sorting` useMemo from `LogTable.tsx`
- [ ] Use `initialState: { sorting: [{ id: 'timestamp', desc: true }] }` in `useReactTable` for default sort
- [ ] Wire `getSortedRowModel()` in `useReactTable`
- [ ] Set `enableSorting: false` on `resource` and `body` column defs
- [ ] Replace inline `sortHeader` helper with `<SortableHeader column={column} label="..." />` in `header` render props
- [ ] Move column defs back to module level (no more `sortState` closure dependency)
- [ ] Sortable `TableHead` cells have `cursor-pointer select-none` (rendered inside `SortableHeader`)

### Sort state

Managed internally by TanStack Table. No component-level state in `LogTable`.

Default set via `initialState`: `{ sorting: [{ id: 'timestamp', desc: true }] }` (newest first).

`SortableHeader` reads state via `column.getIsSorted()`:
- `false` → inactive (no active sort on this column)
- `'asc'` → ascending
- `'desc'` → descending

Click dispatched via `column.getToggleSortingHandler()`.

### SortableHeader component

`components/shared/SortableHeader.tsx` — Client Component.

Props: `{ column: Column<LogRecord>; label: string }`

Renders a `<button type="button">` with `cursor-pointer select-none` containing:
- label text
- icon from lucide-react selected by `column.getIsSorted()`:
  - `false` → `ArrowUpDown` with `text-muted-foreground`
  - `'desc'` → `ArrowDown`
  - `'asc'` → `ArrowUp`

### Header rendering

- Active desc column → label + `ArrowDown`
- Active asc column → label + `ArrowUp`
- Inactive sortable column → label + `ArrowUpDown` (muted)
- Non-sortable headers (Resource, Body): plain string, no icon

### New correctness criteria

#### Sort — Severity

- [x] Severity header is clickable
- [x] Clicking Severity (when inactive) sorts rows by `severityNumber` descending (highest severity first) — TanStack auto-sorts numbers desc-first
- [x] Clicking active Severity header toggles direction
- [x] `ArrowDown` shown when desc, `ArrowUp` when asc

#### Sort — Time

- [x] Time header is clickable
- [x] Default initial sort is timestamp descending (newest first)
- [x] Clicking Time (when inactive) sets sort to timestamp desc — enforced via `sortDescFirst: true` on column def (Date is not a number; TanStack would default to asc without this)
- [x] Clicking active Time header toggles direction
- [x] `ArrowDown` shown when desc, `ArrowUp` when asc

#### Sort — inactive column

- [x] Inactive sortable column shows `ArrowUpDown` icon in muted style
- [x] Body column header has no icon and no click handler — `enableSorting: false`, plain string header

#### Sort — state

- [x] Sort state managed by TanStack Table internally — no `SortState` in `LogTable`
- [x] Switching to a new column resets direction to descending — numbers auto desc-first; `sortDescFirst: true` on timestamp
- [x] `SortableHeader` component exists at `components/shared/SortableHeader.tsx`
- [x] `SortableHeader` props: `{ column: Column<LogRecord>; label: string }`

---

## 15. Iteration 1.9 — Changes

This section records what changed between iteration 1.8 and iteration 1.9.
Existing §9, §12, §13, and §14 criteria are already satisfied and must not regress.

### What changed

| #   | Change                                            | Affected files                 |
| --- | ------------------------------------------------- | ------------------------------ |
| 1   | New Resource column between Time and Body         | `components/logs/LogTable.tsx` |

### What to leave untouched

All `lib/` files — no transform changes needed; resource attributes already merged into `LogRecord.attributes` with `resource.` prefix.

### Implementation checklist

- [ ] Import `Badge` from `@/components/ui/badge` in `LogTable.tsx`
- [ ] Add `resource` column def between `timestamp` and `body` in `columns` array
- [ ] Read `row.original.attributes["resource.service.name"]` and `row.original.attributes["resource.service.namespace"]`
- [ ] Render `Badge` variant `"secondary"` for each present attribute
- [ ] Badge content: `<span className="text-muted-foreground">service.name:</span>{value}` (strip `resource.` prefix from label)
- [ ] Stack badges with `flex flex-col gap-1` wrapper
- [ ] Column header: plain `"Resource"` string — non-sortable, no icon
- [ ] `TableHead` for Resource: no `whitespace-nowrap`, no fixed width class

### New correctness criteria

#### Resource column — badges

- [ ] Resource column appears between Time and Body
- [ ] Row with `resource.service.name` attribute shows badge labeled `service.name:<value>`
- [ ] Row with `resource.service.namespace` attribute shows badge labeled `service.namespace:<value>`
- [ ] Badges use shadcn `Badge` component with variant `"secondary"`
- [ ] Key prefix (`service.name:`, `service.namespace:`) rendered in `text-muted-foreground` style
- [ ] Badge absent when corresponding attribute is not present in `row.original.attributes`
- [ ] Cell is empty when both attributes absent — no placeholder text

#### Resource column — layout

- [ ] Column is NOT `whitespace-nowrap` — flexible width, max `1fr`
- [ ] Header reads "Resource" — no sort icon, not clickable

---

## 17. Iteration 2.0 — Changes

This section records what changed between iteration 1.9 and iteration 2.0.
Existing §9, §12–§15 criteria are already satisfied and must not regress.

### What changed

| #   | Change                                                   | Affected files                 |
| --- | -------------------------------------------------------- | ------------------------------ |
| 1   | Severity column: fixed 120px width                       | `components/logs/LogTable.tsx` |
| 2   | Time column: fixed 200px width                           | `components/logs/LogTable.tsx` |
| 3   | Resource column: min-content width, capped at 300px      | `components/logs/LogTable.tsx` |
| 4   | Body column: fills remaining space                       | `components/logs/LogTable.tsx` |
| 5   | Body cell: single-line truncation with native tooltip    | `components/logs/LogTable.tsx` |

### What to leave untouched

All `lib/` files and all other components.

### Column width contract

| Column   | Width rule                                       | Tailwind approach                                         |
| -------- | ------------------------------------------------ | --------------------------------------------------------- |
| Severity | Fixed 120px — no shrink, no grow                 | `w-[120px] min-w-[120px] max-w-[120px]` on head and cell |
| Time     | Fixed 200px — no shrink, no grow                 | `w-[200px] min-w-[200px] max-w-[200px]` on head and cell |
| Resource | Sizes to content, maximum 300px                  | `w-auto` on head/cell; content wrapped in `max-w-[300px] overflow-hidden` div |
| Body     | Absorbs all remaining width                      | `min-w-0` on head and cell; body text uses `truncate`    |

Header `<TableHead>` and data `<CellWrapper>` carry identical width classes per column so they stay in sync.

### Body cell behaviour

Body text renders as a single line with ellipsis truncation (`truncate` — `overflow-hidden text-ellipsis whitespace-nowrap`).
Full text accessible via native HTML `title` attribute (browser tooltip on hover).
Chevron button remains at the right edge, vertically centred on the single line.

### Implementation checklist

- [ ] Apply `w-[120px] min-w-[120px] max-w-[120px]` to `TableHead` and `CellWrapper` for `severityNumber` column
- [ ] Apply `w-[200px] min-w-[200px] max-w-[200px]` to `TableHead` and `CellWrapper` for `timestamp` column
- [ ] Apply `w-auto` to `TableHead` and `CellWrapper` for `resource` column; wrap cell content in `<div className="max-w-[300px] overflow-hidden">`
- [ ] Apply `min-w-0` to `TableHead` and `CellWrapper` for `body` column
- [ ] Change body text from `line-clamp-3` to `truncate`; keep `title={row.original.body}`

### New correctness criteria

#### Column widths

- [ ] Severity column header and cells are exactly 120px — no wider, no narrower
- [ ] Time column header and cells are exactly 200px — no wider, no narrower
- [ ] Resource column header and cells size to content width, never exceeding 300px
- [ ] Body column header and cells absorb all remaining table width
- [ ] Header widths visually match their corresponding data column widths

#### Body cell

- [ ] Body text renders on a single line with ellipsis when truncated
- [ ] Hovering a truncated body cell shows full text via native browser tooltip
- [ ] Chevron button remains visible and functional at the right edge

---

## 16. Open decisions (deferred to v2)

| Decision                                   | Rationale                                             |
| ------------------------------------------ | ----------------------------------------------------- |
| Light/dark toggle                          | Dark only in v1                                       |
| Timezone toggle (local vs UTC)             | Local sufficient for v1                               |
| Relative timestamps                        | Requires polling or live clock                        |
| Virtual scrolling                          | Revisit when pagination is introduced                 |
| Semantic convention attribute highlighting | Adds coupling to semconv versions                     |
| Search / filter implementation             | Layout space reserved in FilterBar                    |
| Totals endpoint integration                | Hypothetical in v1; `LogStats` interface ready for it |
| Multiple sidebar nav items                 | Only Log Explorer in v1                               |
