import { toArabicDigits } from "@/lib/hadees";
import { cn } from "@/lib/utils";

/**
 * A hadith or section number in a ruled rubric circle, set in Arabic-Indic
 * numerals the way printed volumes number their narrations.
 */
export function Medallion({
  number,
  variantLetter,
  size = "default",
  className,
}: {
  number: number;
  /** Variant narrations carry a letter: HA270A is variant A of 270. */
  variantLetter?: string | null;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-rubric/50 bg-paper font-arabic text-rubric",
          size === "sm" ? "size-8 text-sm" : "size-10 text-base",
        )}
      >
        {toArabicDigits(number)}
      </span>
      {variantLetter ? (
        <span className="font-mono text-[0.625rem] font-medium tracking-wider text-rubric">
          {variantLetter}
        </span>
      ) : null}
      <span className="sr-only">
        {variantLetter
          ? `Number ${number}, variant ${variantLetter}`
          : `Number ${number}`}
      </span>
    </span>
  );
}
