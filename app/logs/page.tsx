import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogsPageHeader } from "@/components/logs/LogsPageHeader";
import { LogsPageWrapper } from "@/components/logs/LogsPageWrapper";
import { RetryButton } from "@/components/shared/RetryButton";
import { transform } from "@/lib/logs/transform";
import { computeLogStats } from "@/lib/logs/stats.util";
import type { ExportLogsServiceRequest } from "@/lib/otlp-types";

export default async function LogsPage() {
  let records;
  let stats;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/logs`,
    );
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const payload: ExportLogsServiceRequest = await res.json();
    records = transform(payload);
    stats = computeLogStats(records);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return (
      <>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Failed to load logs</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              {message}
              <RetryButton />
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <LogsPageHeader stats={stats} />
      <LogsPageWrapper records={records} />
    </>
  );
}