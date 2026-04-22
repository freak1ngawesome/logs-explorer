const NANOS_PER_MILLI = BigInt(1_000_000);

export function parseTimestamp(
  timeUnixNano: string | undefined,
  observedTimeUnixNano: string | undefined,
): Date {
  const raw =
    timeUnixNano && timeUnixNano !== "0" ? timeUnixNano : observedTimeUnixNano;
  if (!raw || raw === "0") return new Date(0);
  const ms = Number(BigInt(raw) / NANOS_PER_MILLI);
  return new Date(ms);
}

export function buildId(
  resourceIndex: number,
  scopeIndex: number,
  recordIndex: number,
): string {
  return `${resourceIndex}-${scopeIndex}-${recordIndex}`;
}
