# OTLP Log Viewer

Playground app for exploring OpenTelemetry logs. Fetches OTLP-formatted log data from a mock API endpoint and renders it in an interactive table with histogram, filtering, sorting, and group-by.

Try it out here: [Vercel](https://logs-explorer.vercel.app/logs)

## Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind 4 + shadcn/ui (Base UI primitives) |
| Table | TanStack Table v8 |
| Data fetching | TanStack Query v5 |
| Charts | Recharts 3 |
| Types | TypeScript 5 |
| Tests | Vitest 4 |

## OTLP Types from Proto

Types in `lib/otlp-types.ts` are generated from the official [opentelemetry-proto](https://github.com/open-telemetry/opentelemetry-proto) definitions.

### Prerequisites

Clone [opentelemetry-proto](https://github.com/open-telemetry/opentelemetry-proto) repo into project folder

```bash
# Install protoc (macOS)
brew install protobuf

# Install ts-proto
npm install
```

### Regenerate types

```bash
npm run proto:otel:gen
```

This runs:

```bash
protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./generated \
  --ts_proto_opt=onlyTypes=true \
  --proto_path=./opentelemetry-proto \
  opentelemetry/proto/logs/v1/logs.proto \
  opentelemetry/proto/common/v1/common.proto \
  opentelemetry/proto/resource/v1/resource.proto \
  opentelemetry/proto/collector/logs/v1/logs_service.proto
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/logs](http://localhost:3000/logs).

## Project Structure

```
app/                        # Next.js App Router — routes, layouts, API handlers
  api/logs/                 # mock REST endpoint serving static OTLP payload
  logs/                     # /logs route (RSC page + loading/error boundaries)

components/
  logs/                     # log-page components: table, histogram, group-by, expanded row
  logs/cells/               # individual table cell renderers
  logs/histogram/           # Recharts histogram: bucketing, legend, tooltip
  shared/                   # reusable UI primitives (SeverityPill, FilterBar, SortableHeader…)
  ui/                       # shadcn-generated base components

lib/logs/                   # all data logic: OTLP transform, severity, grouping, histogram, stats
lib/mock/                   # static OTLP payload for local dev

hooks/                      # React hooks (row expansion, viewport breakpoint)
providers/                  # client-side context providers (QueryClient)
generated/                  # ts-proto output — do not edit
opentelemetry-proto/        # official OTel proto definitions (codegen source)
specs/                      # per-feature design docs
```
