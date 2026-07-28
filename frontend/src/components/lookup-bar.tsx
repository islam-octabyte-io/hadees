import { ArrowRight } from "lucide-react";

import { lookup } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Go straight to a citation. This speaks the API's own identifier grammar, so
 * whatever a reader would write in a footnote resolves: a UCI, a collection and
 * number, or a full book:kitab:baab address.
 *
 * It is a lookup, not a search — the corpus has no full-text index exposed yet
 * and the copy never implies otherwise.
 */
export function LookupBar({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "compact";
  className?: string;
}) {
  const isHero = variant === "hero";

  return (
    <form
      action={lookup}
      className={cn("flex items-center gap-2", isHero && "max-w-xl", className)}
    >
      <label htmlFor={`lookup-${variant}`} className="sr-only">
        Go to a hadith, kitab or baab by number
      </label>
      <Input
        id={`lookup-${variant}`}
        name="q"
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={isHero ? "bukhari:100, HB100, bukhari:3:5" : "bukhari:100"}
        aria-describedby={isHero ? "lookup-hint" : undefined}
        className={cn(
          "border-jadwal bg-paper font-mono text-foreground placeholder:text-ink-3/70",
          isHero ? "h-11 text-base" : "h-8 w-44 text-xs",
        )}
      />
      <Button
        type="submit"
        variant="outline"
        size={isHero ? "lg" : "sm"}
        className="shrink-0 border-jadwal"
      >
        {isHero ? "Go" : null}
        <ArrowRight data-icon={isHero ? "inline-end" : undefined} />
      </Button>
    </form>
  );
}

/** The hint that teaches the grammar; only the hero form is wide enough for it. */
export function LookupHint({ className }: { className?: string }) {
  return (
    <p
      id="lookup-hint"
      className={cn("font-mono text-[0.6875rem] text-ink-3", className)}
    >
      A collection and number goes to that narration —{" "}
      <span className="text-rubric">bukhari:100</span>. UCIs work too:{" "}
      <span className="text-rubric">HB100</span> for a narration,{" "}
      <span className="text-rubric">HK3</span> for a kitab. Three parts address
      a baab — <span className="text-rubric">bukhari:3:5</span>.
    </p>
  );
}
