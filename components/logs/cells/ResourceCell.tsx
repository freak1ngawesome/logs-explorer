import { ResourceBadge } from "@/components/shared/ResourceBadge";

interface ResourceCellProps {
  attributes: Record<string, string>;
}

export function ResourceCell({ attributes }: ResourceCellProps) {
  const name = attributes["resource.service.name"];
  const ns = attributes["resource.service.namespace"];
  if (!name && !ns) return null;
  return (
    <div className="flex gap-1">
      {name && <ResourceBadge label="service.name" value={name} />}
      {ns && <ResourceBadge label="service.namespace" value={ns} truncate />}
    </div>
  );
}
