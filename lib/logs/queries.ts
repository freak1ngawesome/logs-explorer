import { queryOptions } from "@tanstack/react-query";
import { transformIntoLogRecords } from "./transform";
import { computeLogStats } from "./stats.util";
import type { ExportLogsServiceRequest } from "@/lib/otlp-types";

const LOGS_URL =
  "https://take-home-assignment-otlp-logs-api.vercel.app/api/logs";

export const logsQueryOptions = queryOptions({
  queryKey: ["logs"],
  retry: false,
  throwOnError: true,
  queryFn: async () => {
    const res = await fetch(LOGS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const payload: ExportLogsServiceRequest = await res.json();
    const records = transformIntoLogRecords(payload);
    const stats = computeLogStats(records);
    return { records, stats };
  },
});
