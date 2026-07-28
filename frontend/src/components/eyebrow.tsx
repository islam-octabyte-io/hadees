import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tracked mono caps — the catalogue-card voice used for every Latin label in
 * the app. Latin here is apparatus, never display type.
 */
export function Eyebrow({
  as: Tag = "p",
  className,
  children,
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
