import type * as React from "react";

import { Eyebrow } from "@/components/eyebrow";
import { ScriptText } from "@/components/script-text";
import { cn } from "@/lib/utils";

/**
 * The heading every reader page shares: a mono catalogue label, the title in
 * Arabic, the Urdu name beneath it, and the counts as apparatus.
 */
export function PageHeader({
  eyebrow,
  titleArabic,
  titleUrdu,
  titleFallback,
  meta,
  className,
  children,
}: {
  eyebrow: React.ReactNode;
  titleArabic?: string | null;
  titleUrdu?: string | null;
  /** Shown when the corpus has no title for this section. */
  titleFallback?: string;
  /** Counts and identifiers, already formatted. */
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("border-b border-jadwal pb-8", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>

      {titleArabic ? (
        <ScriptText lang="ar" as="h1" size="display" className="mt-3">
          {titleArabic}
        </ScriptText>
      ) : (
        <h1 className="mt-3 font-mono text-2xl text-foreground">
          {titleFallback ?? "Untitled"}
        </h1>
      )}

      {titleUrdu ? (
        <ScriptText lang="ur" size="body" tone="ink-3" className="mt-2">
          {titleUrdu}
        </ScriptText>
      ) : null}

      {meta ? (
        <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase tabular-nums">
          {meta}
        </p>
      ) : null}

      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
