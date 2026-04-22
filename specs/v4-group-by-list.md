# v4-group-by-list — Grouped Log View Spec

## §0 Status

New feature. Additive — no existing behaviour changes.

## §1 Stack

No new npm packages. Uses:
- `lucide-react` (already present) — `List`, `Layers` icons
- `@base-ui/react` (already present) — primitive layer for generated Select
- shadcn CLI: `npx shadcn@latest add select` — generates `components/ui/select.tsx` using @base-ui/react/select
- `@tanstack/react-table` (already present)

## §2 Data Model

### §2.1 GroupByField

```ts
type GroupByField = "none" | "service.name";
```

### §2.2 ServiceGroup

```ts
interface ServiceGroup {
  serviceName: string;   // attributes["resource.service.name"] ?? "(unknown)"
  records: LogRecord[];  // all records for this service, original order preserved
  count: number;         // records.length
}
```

## §3 Grouping Utility

File: `lib/logs/groupBy.util.ts`

```ts
function groupByServiceName(records: LogRecord[]): ServiceGroup[]
```

Rules:
- Key = `record.attributes["resource.service.name"] ?? "(unknown)"`
- Insertion order within each group preserved
- Result sorted by `count` desc (ties: alphabetical by serviceName)

Tests: `lib/logs/groupBy.util.test.ts`
- Groups correctly
- Missing attribute → "(unknown)" bucket
- Sort: highest count first

## §4 Components

### §4.1 GroupBySelector

File: `components/logs/GroupBySelector.tsx`

Props:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| value | GroupByField | yes | Current selection |
| onChange | (v: GroupByField) => void | yes | Selection change handler |

Renders shadcn `Select`. Trigger shows icon + label of current value — icons always visible in both closed and open states. Options:

| Value | Icon | Label |
|-------|------|-------|
| "none" | `List` (16px) | None |
| "service.name" | `Layers` (16px) | service.name |

Trigger: `w-44`, outline variant. Icon rendered explicitly from OPTIONS map (not via SelectValue), so it always appears regardless of select state.

Dropdown direction: opens downward (`alignItemWithTrigger={false}` on SelectContent).

### §4.2 LogsGroupby

File: `components/logs/LogsGroupby.tsx`

Props:
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| groups | ServiceGroup[] | yes | Pre-computed groups |

Uses `useReactTable` with core + expanded row models.

Columns:
| Column | Accessor | Width | Content |
|--------|----------|-------|---------|
| Service | serviceName | flex-1 | Primary typography (font-medium), serviceName string |
| Logs | count | 80px fixed | Count integer, left-aligned, muted text |
| (chevron) | — | 40px fixed | `ChevronRight` icon, rotates 90° when row expanded |

Row behaviour:
- Click row → toggle expand (one expanded at a time, same pattern as LogTable)
- Expanded row: full colSpan cell with `bg-muted/40`, `pl-8` left indent, renders `<LogTable records={group.records} />`
- LogTable inside expansion has no sticky header offset (sticky top-0 only, no CSS var needed)

Sticky header: `sticky top-[var(--log-controls-h,0px)] z-10` — matches LogTable pattern.

Empty state: "No log records found." (matches LogTable).

### §4.3 LogsPageWrapper changes

File: `components/logs/LogsPageWrapper.tsx`

Current state: no props — fetches `data` from `useQuery(logsQueryOptions)` internally.

Add state:
```ts
const [groupBy, setGroupBy] = useState<GroupByField>("none");
```

Derive groups (only when needed, from `data.records`):
```ts
const groups = useMemo(
  () => (groupBy === "service.name" ? groupByServiceName(data.records) : []),
  [data, groupBy],
);
```

Layout change — filter bar row (no props changes to `LogsPageWrapper` signature):
```tsx
<div className="flex items-center gap-2 mb-1">
  <GroupBySelector value={groupBy} onChange={setGroupBy} />
  <FilterBar />
</div>
```

Table area — conditional:
```tsx
{groupBy === "none"
  ? <LogTable records={data.records} />
  : <LogsGroupby groups={groups} />}
```

## §5 Behaviour

- Default: `groupBy = "none"` → renders LogTable unchanged.
- Switching to "service.name": renders LogsGroupby; all rows collapsed.
- Switching back to "none": renders LogTable; no state preserved.
- Row expand in LogsGroupby: max 1 row at a time (onExpandedChange same logic as LogTable).
- Expanded LogTable shows only records for that service group.
- LogsGroupby sticky header tracks `--log-controls-h` same as LogTable.

## §6 Acceptance Criteria

1. GroupBySelector visible left of search input in sticky controls row.
2. Default selection is "None" with List icon — icon visible in closed trigger.
3. "service.name" option shows Layers icon in both trigger (closed) and dropdown (open).
4. Dropdown opens downward from trigger (not upward, not item-aligned).
5. Selecting "service.name" replaces flat table with grouped table.
6. Grouped table shows one row per service, count correct, left-aligned.
7. Each group row has a ChevronRight on the far right; collapses (rotated 90°) when expanded.
8. Logs with no `resource.service.name` appear in "(unknown)" row.
9. Click row → expands; expanded area has left indent (`pl-8`) and muted background.
10. Only one group row expanded at a time.
11. Expanded area shows full LogTable for that service.
12. Switching back to "None" restores full flat LogTable.
13. `groupByServiceName` unit tests pass.

## §8 Verification Steps

1. `npm run dev` — open `http://localhost:3000/logs`
2. Confirm GroupBySelector is left of search bar, shows "≡ None" (List icon + label)
3. Click selector — confirm dropdown opens **below** trigger, not upward
4. Both options show icons (List / Layers) in the dropdown list
5. Select "service.name" — confirm trigger now shows "⊞ service.name" (Layers icon + label)
6. Confirm grouped table renders: Service + Logs + (chevron) columns
7. Confirm Logs count is left-aligned
8. Confirm ChevronRight icon visible on right of every row (pointing right when collapsed)
9. Click a row — confirm chevron rotates 90°, expanded area appears with left indent and darker bg
10. Click another row — first collapses, second expands
11. Confirm expanded LogTable shows only records for that service (row count = group's Logs count)
12. Select "None" — flat LogTable returns unchanged
13. `npx vitest run lib/logs/groupBy.util.test.ts` — 6 tests pass
14. `npx tsc --noEmit` — no new errors

## §7 Out of Scope

- Persisting groupBy selection (URL, localStorage)
- Multiple group-by fields
- Filtering within groups
- Sorting grouped table by serviceName
