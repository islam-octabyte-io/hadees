import Link from "next/link";

import { ScriptText } from "@/components/script-text";

/**
 * A crumb is either Latin apparatus (a slug, a number) or a title in the
 * corpus's own script — `lang` decides which, so the face follows the content.
 */
export type Crumb = {
  label: string;
  href?: string;
  /** Set for Arabic or Urdu labels; omit for Latin apparatus. */
  lang?: string;
};

/** The trail down Book → Kitab → Baab, set as a catalogue line. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-2"
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="font-mono text-xs text-ink-3/60"
              >
                /
              </span>
            ) : null}
            <CrumbLabel item={item} isLast={index === items.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CrumbLabel({ item, isLast }: { item: Crumb; isLast: boolean }) {
  const tone = isLast ? "text-foreground" : "text-ink-3";

  const content = item.lang ? (
    <ScriptText
      lang={item.lang}
      as="span"
      size="inline"
      className={`text-sm ${tone}`}
    >
      {item.label}
    </ScriptText>
  ) : (
    <span
      className={`font-mono text-[0.6875rem] tracking-[0.16em] uppercase ${tone}`}
    >
      {item.label}
    </span>
  );

  if (!item.href || isLast) return content;

  return (
    <Link
      href={item.href}
      className="transition-colors hover:text-rubric focus-visible:text-rubric"
    >
      {content}
    </Link>
  );
}
