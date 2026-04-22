import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";

interface FilterBarProps {
  children?: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  if (children) return <div>{children}</div>;

  return <Input disabled placeholder="Search logs…" className="w-full" />;
}
