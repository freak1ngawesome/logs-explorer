# API Layer v3 — real backend + client-side reload

## Purpose

Replace self-hosted mock route with real OTLP logs API.
Add client-side reload via TanStack Query `refetch()` — no full page re-render.

---

## Scope

| File | Change |
|---|---|
| `lib/logs/queries.ts` | NEW — `logsQueryOptions` (queryKey + queryFn) |
| `lib/query-client.ts` | NEW — `getQueryClient()` factory (isServer pattern) |
| `providers/QueryProvider.tsx` | NEW — `QueryClientProvider` wrapper |
| `app/layout.tsx` | MODIFY — wrap children in `QueryProvider` |
| `app/logs/page.tsx` | MODIFY — `prefetchQuery` + `HydrationBoundary` |
| `components/logs/LogsPage.tsx` | NEW — client component, `useQuery`, renders header + wrapper |
| `components/logs/LogsPageHeader.tsx` | MODIFY — `onReload` + `isPending` props + reload button |
| `app/logs/error.tsx` | NEW — Next.js error boundary for fetch failures |

## Out of scope

- Polling / auto-refresh
- `NEXT_PUBLIC_BASE_URL` env var (removed from fetch path)
- Local `/api/logs` route (kept as dev mock, unused by page)
- Pagination, infinite scroll, live-tail

---

## Design rationale — SSR prefetch + client refetch

**Initial load — SSR prefetch:**

Server component calls `prefetchQuery(logsQueryOptions)`, dehydrates via `HydrationBoundary`.
Client `useQuery` rehydrates instantly from dehydrated state — zero waterfall on first paint.

**Reload — client `refetch()`:**

`refetch()` from `useQuery` hits the real BE directly from the browser.
Updates only the query cache → only data-consuming components re-render.
No `router.refresh()` (full round-trip, full server component re-run).

**Why client fetch for a log explorer:**

In real observability tools (Datadog Logs, Grafana Loki), client-driven fetching is the correct
pattern because:
- Infinite scroll / cursor pagination = incremental client requests
- Live-tail = SSE or WebSocket (client-only by nature)
- Filter changes = new query without full page reload

Both features are absent here for simplicity, but this architecture sets the right foundation.

---

## Backend contract

| | |
|---|---|
| URL | `https://take-home-assignment-otlp-logs-api.vercel.app/api/logs` |
| Method | GET |
| Auth | none |
| Response | `ExportLogsServiceRequest` (OTLP wire format — same as mock) |

---

## Data flow

**Initial load (SSR):**
```
app/logs/page.tsx (RSC)
  getQueryClient()
  → prefetchQuery(logsQueryOptions)
     → fetch(LOGS_URL, { cache: "no-store" })
     → transform(payload) → LogRecord[]
     → computeLogStats(records) → LogStats
     → cache: { records, stats }
  → HydrationBoundary(dehydrate(queryClient))
     → <LogsPage />
```

**Client mount:**
```
LogsPage (client component)
  useQuery(logsQueryOptions)
  → rehydrates from HydrationBoundary state immediately
  → renders LogsPageHeader + LogsPageWrapper with data
```

**Reload:**
```
User clicks reload button
  handleReload() → startTransition(() => refetch())
  → fetch(LOGS_URL) [direct from browser]
  → transform + computeLogStats
  → update query cache
  → re-render LogsPageHeader + LogsPageWrapper
```

`cache: "no-store"` on both SSR and client fetches prevents stale CDN/browser cache.

---

## `logsQueryOptions`

**File:** `lib/logs/queries.ts`

```ts
queryOptions({
  queryKey: ["logs"],
  throwOnError: true,
  queryFn: async () => {
    const res = await fetch(LOGS_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    const payload: ExportLogsServiceRequest = await res.json()
    const records = transform(payload)
    return { records, stats: computeLogStats(records) }
  },
})
```

`throwOnError: true` — errors propagate to the nearest React error boundary (`app/logs/error.tsx`)
instead of being captured silently in `isError` state.

---

## `getQueryClient()`

**File:** `lib/query-client.ts`

Uses the official TanStack Query v5 `isServer` pattern:
- Server: always creates a fresh `QueryClient` (no cross-request state leakage)
- Browser: module-level singleton — survives React Suspense re-renders

---

## `QueryProvider`

**File:** `providers/QueryProvider.tsx`

`"use client"` wrapper around `QueryClientProvider`. Calls `getQueryClient()` which returns the
browser singleton. Mounted once in `app/layout.tsx`.

---

## `LogsPage` component

**File:** `components/logs/LogsPage.tsx`

```
Type: "use client"
Query: useQuery(logsQueryOptions) → { data, refetch, isFetching }
Transition: useTransition → [isPending, startTransition]
handleReload: startTransition(() => refetch())

Renders:
  <LogsPageHeader stats={data.stats} onReload={handleReload} isPending={isFetching || isPending} />
  <LogsPageWrapper records={data.records} />
```

`data` is always defined at mount (HydrationBoundary guarantees it). Guard `if (!data) return null`
handles the narrow window before hydration completes.

---

## `LogsPageHeader` changes

New props added to `LogsPageHeaderProps`:

| Prop | Type | Description |
|---|---|---|
| `onReload` | `() => void` | Called on reload button click |
| `isPending` | `boolean` | Drives spinner + disabled state |

New element (right of clock Button):
```tsx
<Button variant="outline" size="sm" disabled={isPending} onClick={onReload} aria-label="Reload logs">
  <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
</Button>
```

Right-side layout wraps both buttons in `<div className="flex items-center gap-2">`.

---

## Error handling

**File:** `app/logs/error.tsx` (Next.js route error boundary)

Catches errors thrown by `useQuery` (enabled by `throwOnError: true`) and unhandled
client-side crashes. Renders `Alert` with error message and a `reset()` retry button.

`prefetchQuery` on the server silently swallows errors — if SSR fetch fails, the client
mounts with no cached data, `useQuery` triggers a client-side fetch, and if that also fails,
`throwOnError` propagates to this boundary.

---

## Acceptance criteria

1. Page loads with real BE data (not 46-record mock).
2. Reload button visible in header, right of timezone chip.
3. Click reload → `RefreshCw` spins → data updates without full page flash.
4. On BE failure: error boundary renders `Alert` with retry; clicking retry re-runs query.
5. `npx tsc --noEmit` — zero errors.
6. DevTools Network: reload = direct GET to `https://take-home-assignment-otlp-logs-api.vercel.app/api/logs`.
