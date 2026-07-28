import Link from "next/link";

import { ScriptText } from "@/components/script-text";
import type { Book } from "@/lib/api/client";
import { formatCount } from "@/lib/hadees";

/**
 * A collection on the index. The Arabic title is the hero — it is the most
 * characteristic thing in the corpus — so the six sahih get it at display size
 * and the rest are set as a compact ruled list.
 */
export function BookPlate({
  book,
  narrations,
  variant = "compact",
}: {
  book: Book;
  /** Total narrations, from the paginated meta. */
  narrations?: number;
  variant?: "sahih" | "compact";
}) {
  const href = `/books/${book.slug}`;

  if (variant === "sahih") {
    return (
      <Link
        href={href}
        className="group flex h-full flex-col justify-between gap-6 bg-paper px-6 py-7 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div>
          <ScriptText
            lang="ar"
            as="h3"
            size="display"
            className="transition-colors group-hover:text-rubric"
          >
            {book.nameArabic}
          </ScriptText>
          <ScriptText lang="ur" size="note" tone="ink-3" className="mt-2">
            {book.nameUrdu}
          </ScriptText>
        </div>
        <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase">
          {book.hadithPrefix}
          {narrations === undefined ? "" : ` · ${formatCount(narrations)}`}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 border-b border-jadwal px-1 py-4 transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3"
    >
      <span
        aria-hidden="true"
        className="w-8 shrink-0 font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase group-hover:text-rubric"
      >
        {book.hadithPrefix}
      </span>
      <span className="min-w-0 flex-1">
        <ScriptText
          lang="ar"
          size="title"
          className="transition-colors group-hover:text-rubric"
        >
          {book.nameArabic}
        </ScriptText>
        <ScriptText lang="ur" size="note" tone="ink-3" className="mt-0.5">
          {book.nameUrdu}
        </ScriptText>
      </span>
      {narrations === undefined ? null : (
        <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 tabular-nums">
          {formatCount(narrations)}
        </span>
      )}
    </Link>
  );
}
