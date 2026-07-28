"use client";

import { usePathname, useRouter } from "next/navigation";

import { ScriptText } from "@/components/script-text";
import type { Edition } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** Each language names itself, in its own script. */
const LABELS: Record<string, string> = { ar: "عربي", ur: "اردو" };

/**
 * Which editions the reader sees, written to `?edition=` so a link carries the
 * choice with it. The last remaining edition cannot be switched off — a reader
 * with no text is not a state worth being able to reach.
 *
 * The active set and the surrounding query arrive as props from the page rather
 * than being read with `useSearchParams`, which would suspend and force the
 * response to start streaming before a page can answer 404.
 */
export function EditionPicker({
  editions,
  active,
  query,
  className,
}: {
  editions: Edition[];
  /** Slugs currently being shown, already resolved by the page. */
  active: string[];
  /** The page's other search params, preserved across a toggle. */
  query?: Record<string, string | undefined>;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shown = new Set(active);

  function toggle(slug: string) {
    const next = editions
      .filter((e) => (e.slug === slug ? !shown.has(slug) : shown.has(e.slug)))
      .map((e) => e.slug);
    if (next.length === 0) return;

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      // A different set of editions does not change which page you are on, but
      // it does change how much is on it.
      if (value && key !== "edition" && key !== "page") search.set(key, value);
    }
    search.set("edition", next.join(","));
    router.push(`${pathname}?${search.toString()}`, { scroll: false });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-jadwal p-0.5",
        className,
      )}
      role="group"
      aria-label="Editions shown"
    >
      {editions.map((edition) => {
        const isActive = shown.has(edition.slug);
        const isOnly = isActive && shown.size === 1;

        return (
          <button
            key={edition.uci}
            type="button"
            onClick={() => toggle(edition.slug)}
            aria-pressed={isActive}
            disabled={isOnly}
            title={
              isOnly ? `${edition.name} — the only edition shown` : edition.name
            }
            className={cn(
              "rounded-sm px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isActive
                ? "bg-paper text-rubric"
                : "text-ink-3 hover:text-foreground",
              isOnly && "cursor-default",
            )}
          >
            <ScriptText
              lang={edition.language}
              as="span"
              size="inline"
              className="text-sm"
            >
              {LABELS[edition.language] ?? edition.language.toUpperCase()}
            </ScriptText>
            <span className="sr-only">{edition.name}</span>
          </button>
        );
      })}
    </div>
  );
}
