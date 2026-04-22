import { Badge } from "@/components/ui/badge";

interface ResourceBadgeProps {
  label: string;
  value: string;
  truncate?: boolean;
}

export function ResourceBadge({
  label,
  value,
  truncate = false,
}: ResourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={
        truncate ? "shrink min-w-0 text-xs" : "text-xs whitespace-nowrap"
      }
      title={truncate ? `${label}: ${value}` : undefined}
    >
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className={truncate ? "truncate" : undefined}>{value}</span>
    </Badge>
  );
}
