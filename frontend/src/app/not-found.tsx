import Link from "next/link";

import { LookupBar, LookupHint } from "@/components/lookup-bar";

export default function NotFound() {
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
        Not in the corpus
      </h1>
      <p className="mt-3 max-w-prose text-sm text-ink-3">
        That collection, kitab, baab or narration does not exist. The corpus
        holds fifteen collections — start from the index, or go straight to a
        citation.
      </p>

      <div className="mt-8">
        <LookupBar />
        <LookupHint className="mt-2" />
      </div>

      <Link
        href="/"
        className="mt-8 inline-block font-mono text-[0.6875rem] tracking-[0.16em] text-rubric uppercase underline decoration-rubric/40 underline-offset-4 transition-colors hover:decoration-rubric"
      >
        ‹ All collections
      </Link>
    </div>
  );
}
