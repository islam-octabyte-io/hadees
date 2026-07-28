import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Used wherever the corpus has a hole: an untranslated hadith, an empty
 * listing, a page that does not exist. Says what is missing and what to do,
 * never just "no results".
 */
export function EmptyState({
  title,
  detail,
  glyph = "؞",
  className,
  children,
}: {
  title: string;
  detail?: string;
  /** An Arabic mark standing in for the missing text. */
  glyph?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("py-8 text-center", className)}>
      {glyph ? (
        <p aria-hidden="true" className="font-arabic text-3xl text-rubric/50">
          {glyph}
        </p>
      ) : null}
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {detail ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">{detail}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
