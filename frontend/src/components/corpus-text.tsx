import { ScriptText } from "@/components/script-text";
import { parseCorpusText } from "@/lib/corpus-text";
import { cn } from "@/lib/utils";
import type * as React from "react";

/**
 * Corpus text as it should read: the source's paragraph breaks kept, and its
 * commentary headings promoted to the rubric instead of showing up as raw
 * markup mid-sentence.
 *
 * Every hadith text, hashia and takhreej renders through here.
 */
export function CorpusText({
  children,
  lang,
  size,
  tone,
  className,
  prefix,
}: {
  /** Raw text straight from the API. */
  children: string;
  lang: string;
  size?: React.ComponentProps<typeof ScriptText>["size"];
  tone?: React.ComponentProps<typeof ScriptText>["tone"];
  className?: string;
  /** A label set in the rubric ahead of the text, e.g. حاشیہ. */
  prefix?: string;
}) {
  const segments = parseCorpusText(children);

  return (
    <ScriptText
      lang={lang}
      size={size}
      tone={tone}
      className={cn("whitespace-pre-line", className)}
    >
      {prefix ? <span className="text-rubric">{prefix} </span> : null}
      {segments.map((segment, index) =>
        segment.kind === "heading" ? (
          <span key={index} className="text-rubric">
            {segment.value}
          </span>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </ScriptText>
  );
}
