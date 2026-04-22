import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { logsQueryOptions } from "@/lib/logs/queries";
import { LogsPageHeader } from "@/components/logs/LogsPageHeader";
import { LogsPageWrapper } from "@/components/logs/LogsPageWrapper";

export default async function LogsPageRoute() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(logsQueryOptions);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LogsPageHeader />
      <LogsPageWrapper />
    </HydrationBoundary>
  );
}
