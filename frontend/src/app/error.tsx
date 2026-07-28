"use client";

import { Button } from "@/components/ui/button";

/**
 * Shown when a read fails outright — usually the API being unreachable. Says
 * what happened and offers the one action that might fix it.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <p
        aria-hidden="true"
        className="script-arabic text-5xl text-rubric"
        lang="ar"
      >
        ؞
      </p>
      <h1 className="mt-6 font-mono text-xl tracking-[0.12em] text-foreground uppercase">
        The corpus did not load
      </h1>
      <p className="mt-3 max-w-prose text-sm text-ink-3">
        The reader could not reach the hadith API. Nothing is lost — try the
        request again.
      </p>
      <Button variant="outline" className="mt-8 border-jadwal" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
