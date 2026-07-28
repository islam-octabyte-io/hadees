import { ScriptText } from "@/components/script-text";
import { gradeTone } from "@/lib/hadees";
import { cn } from "@/lib/utils";

/**
 * The grading, set as a scholar's marginal annotation rather than a badge.
 * Weight carries the meaning — a weak grading recedes into the apparatus ink
 * instead of being flagged in a different hue.
 */
const TONE_CLASS = {
  sound: "text-rubric",
  good: "text-rubric/75",
  weak: "text-ink-3",
  other: "text-ink-3",
} as const;

export function GradeMark({
  grade,
  className,
}: {
  grade: string;
  className?: string;
}) {
  return (
    <ScriptText
      lang="ar"
      as="span"
      size="inline"
      className={cn(
        "text-sm whitespace-nowrap",
        TONE_CLASS[gradeTone(grade)],
        className,
      )}
      title={`Grading: ${grade}`}
    >
      {grade}
    </ScriptText>
  );
}
