"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RetryButton } from "@/components/shared/RetryButton";

export default function LogsError({
  error,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertTitle>Failed to load logs</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          {error.message}
          <RetryButton />
        </AlertDescription>
      </Alert>
    </div>
  );
}
