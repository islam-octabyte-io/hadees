import Link from "next/link";

import type { PageMeta } from "@/lib/api/client";
import { formatCount, pluralize } from "@/lib/hadees";
import { cn } from "@/lib/utils";

/**
 * Pagination driven by the API's `meta` envelope. The route supplies
 * `hrefForPage` so this stays ignorant of which search params a page carries.
 */
export function Pager({
  meta,
  hrefForPage,
  className,
}: {
  meta: PageMeta;
  hrefForPage: (page: number) => string;
  className?: string;
}) {
  const { page, totalPages, total } = meta;
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-t border-jadwal pt-6",
        className,
      )}
    >
      <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase tabular-nums">
        Page {page} of {formatCount(totalPages)} ·{" "}
        {pluralize(total, "narration")}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <Step
            href={page > 1 ? hrefForPage(page - 1) : undefined}
            label="Previous"
          >
            ‹
          </Step>
        </li>
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 font-mono text-xs text-ink-3/60"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={hrefForPage(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono text-xs tabular-nums transition-colors",
                  entry === page
                    ? "border border-rubric/50 text-rubric"
                    : "text-ink-3 hover:bg-paper hover:text-foreground",
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
        <li>
          <Step
            href={page < totalPages ? hrefForPage(page + 1) : undefined}
            label="Next"
          >
            ›
          </Step>
        </li>
      </ul>
    </nav>
  );
}

function Step({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  const shared =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono text-sm";

  if (!href) {
    return (
      <span aria-hidden="true" className={cn(shared, "text-ink-3/40")}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        shared,
        "text-ink-3 transition-colors hover:bg-paper hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/** First, last, and the pages either side of the current one. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set<number>([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let previous = 0;
  for (const p of sorted) {
    if (previous && p - previous > 1) out.push("gap");
    out.push(p);
    previous = p;
  }
  return out;
}
