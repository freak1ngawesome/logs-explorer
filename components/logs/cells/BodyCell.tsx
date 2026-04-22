"use client";

interface BodyCellProps {
  body: string;
}

export function BodyCell({ body }: BodyCellProps) {
  return (
    <span className="truncate min-w-0 flex-1 select-text" title={body}>
      {body}
    </span>
  );
}
