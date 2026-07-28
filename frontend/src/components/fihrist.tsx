import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ScriptText } from "@/components/script-text";
import { toArabicDigits } from "@/lib/hadees";

/**
 * One row of a table of contents. Kitabs and baabs are structurally identical
 * in the API, so both levels adapt to this shape and share one renderer.
 */
export type FihristItem = {
  key: string;
  /** Position within the parent, as printed. */
  number: number;
  nameArabic: string | null;
  nameUrdu: string | null;
  href: string;
};

/**
 * The fihrist — a ruled index. Titles are set in the rubric because that is
 * what rubrication is for: marking structure, not decorating it.
 */
export function Fihrist({
  items,
  emptyTitle = "Nothing catalogued here.",
  emptyDetail,
}: {
  items: FihristItem[];
  emptyTitle?: string;
  emptyDetail?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <ol className="border-t border-jadwal">
      {items.map((item) => (
        <li key={item.key} className="border-b border-jadwal">
          <Link
            href={item.href}
            className="group flex items-start gap-4 px-1 py-5 transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-6 sm:px-3"
          >
            <span
              aria-hidden="true"
              className="mt-1 w-8 shrink-0 text-right font-arabic text-sm text-ink-3 group-hover:text-rubric"
            >
              {toArabicDigits(item.number)}
            </span>
            <span className="min-w-0 flex-1">
              {item.nameArabic ? (
                <ScriptText lang="ar" size="title" tone="rubric">
                  {item.nameArabic}
                </ScriptText>
              ) : null}
              {item.nameUrdu ? (
                <ScriptText
                  lang="ur"
                  size="note"
                  tone="ink-3"
                  className={item.nameArabic ? "mt-1" : undefined}
                >
                  {item.nameUrdu}
                </ScriptText>
              ) : null}
              {!item.nameArabic && !item.nameUrdu ? (
                <span className="font-mono text-sm text-ink-3">
                  Untitled section {item.number}
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
