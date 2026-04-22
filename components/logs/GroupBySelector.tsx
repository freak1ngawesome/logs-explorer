"use client";

import { List, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { GroupByField } from "@/lib/logs/groupBy.util";

interface GroupBySelectorProps {
  value: GroupByField;
  onChange: (value: GroupByField) => void;
}

const OPTIONS: Record<GroupByField, { Icon: typeof List; label: string }> = {
  none: { Icon: List, label: "None" },
  "service.name": { Icon: Layers, label: "service.name" },
};

export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  const { Icon, label } = OPTIONS[value];

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
    >
      <SelectTrigger className="w-44 shrink-0">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left text-sm">{label}</span>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value="none">
          <List className="size-4 text-muted-foreground" />
          None
        </SelectItem>
        <SelectItem value="service.name">
          <Layers className="size-4 text-muted-foreground" />
          service.name
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
