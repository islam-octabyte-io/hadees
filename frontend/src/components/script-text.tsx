import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Every Arabic and Urdu string in the app renders through here, so direction,
 * language and typeface never drift from the edition metadata that drives
 * them. Pass the API's own `language` code rather than hard-coding a face.
 */

/** Which face a language is set in. Anything unmapped falls back to naskh. */
const SCRIPT_FOR: Record<string, "arabic" | "urdu"> = {
  ar: "arabic",
  ur: "urdu",
  fa: "urdu",
};

const SIZES = {
  /** Collection titles on the index and page headers. */
  display: "text-[1.875rem] leading-tight sm:text-[2.625rem]",
  /** Kitab and baab headings. */
  title: "text-2xl sm:text-[1.875rem]",
  /** The Arabic matn. */
  matn: "text-xl sm:text-2xl",
  /** A translation pane. */
  body: "text-lg sm:text-xl",
  /** Hashia, takhreej, marginalia. */
  note: "text-[0.95rem] sm:text-base",
  /** Inherit from the surrounding type. */
  inline: "text-[1em]",
} as const;

const TONES = {
  ink: "text-foreground",
  "ink-2": "text-ink-2",
  "ink-3": "text-ink-3",
  rubric: "text-rubric",
} as const;

export function ScriptText({
  lang,
  as: Tag = "p",
  size = "body",
  tone = "ink",
  className,
  children,
  ...props
}: {
  /** ISO 639-1 code from the API, e.g. "ar" or "ur". */
  lang: string;
  as?: React.ElementType;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
} & Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "className" | "lang"
>) {
  const script = SCRIPT_FOR[lang] ?? "arabic";

  return (
    <Tag
      dir="rtl"
      lang={lang}
      className={cn(
        script === "urdu" ? "script-urdu" : "script-arabic",
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
