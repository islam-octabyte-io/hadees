import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The jadwal: the ruled double frame a printed text block sits inside. This
 * app has no cards — a frame and a sheet of paper do that job instead.
 *
 * The outer rule is drawn as an offset outline, so parents must leave about
 * 5px of room around it or it will clip.
 */
export function Jadwal({
  as: Tag = "div",
  className,
  children,
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn("jadwal rounded-none bg-paper", className)}>
      {children}
    </Tag>
  );
}
