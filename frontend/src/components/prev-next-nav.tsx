import Link from "next/link";

import { ScriptText } from "@/components/script-text";

export type NavTarget = {
  href: string;
  label: string;
  /** Set for titles in Arabic or Urdu; omit for Latin apparatus. */
  lang?: string;
};

/**
 * Sequential movement through the corpus. Reading order is what the API's
 * global `number` encodes, so this is how you walk a book straight through.
 */
export function PrevNextNav({
  previous,
  next,
}: {
  previous?: NavTarget | null;
  next?: NavTarget | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Sequential navigation"
      className="grid gap-px border-t border-jadwal pt-6 sm:grid-cols-2 sm:gap-6"
    >
      <Side target={previous} direction="previous" />
      <Side target={next} direction="next" />
    </nav>
  );
}

function Side({
  target,
  direction,
}: {
  target?: NavTarget | null;
  direction: "previous" | "next";
}) {
  const alignment = direction === "next" ? "sm:text-right sm:items-end" : "";

  if (!target) return <div className="hidden sm:block" />;

  return (
    <Link
      href={target.href}
      className={`group flex flex-col gap-1 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${alignment}`}
    >
      <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-ink-3 uppercase">
        {direction === "previous" ? "‹ Previous" : "Next ›"}
      </span>
      {target.lang ? (
        <ScriptText
          lang={target.lang}
          as="span"
          size="inline"
          className="text-base text-ink-2 transition-colors group-hover:text-rubric"
        >
          {target.label}
        </ScriptText>
      ) : (
        <span className="font-mono text-sm text-ink-2 transition-colors group-hover:text-rubric">
          {target.label}
        </span>
      )}
    </Link>
  );
}
