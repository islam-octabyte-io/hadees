import { pluralize } from "@/lib/hadees";

/** Where the corpus came from, and how much of it there is. */
export function SiteFooter({ narrations }: { narrations?: number }) {
  return (
    <footer className="mt-20 border-t border-jadwal">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase tabular-nums">
          15 collections
          {narrations === undefined
            ? ""
            : ` · ${pluralize(narrations, "narration")}`}{" "}
          · 2 editions
        </p>
        <p className="mt-3 max-w-prose text-sm text-ink-3">
          Vocalized Arabic alongside the Dar-us-Salam Urdu translation, with the
          Hashia commentary where the source carries it. Gradings are reproduced
          as the source records them.
        </p>
        <p className="mt-3 text-xs text-ink-3">
          Built by{" "}
          <a
            href="https://octabyte.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-ink-3/40 underline-offset-2 transition-colors hover:text-rubric"
          >
            OctaByte
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
