import Link from "next/link";

import { CorpusText } from "@/components/corpus-text";
import { EmptyState } from "@/components/empty-state";
import { Eyebrow } from "@/components/eyebrow";
import { GradeMark } from "@/components/grade-mark";
import { Jadwal } from "@/components/jadwal";
import { Medallion } from "@/components/medallion";
import type { Book, Edition, Hadith } from "@/lib/api/client";
import { textFor } from "@/lib/api/client";
import { citationOf, hadithHref } from "@/lib/hadees";

/** Labels in the reader's own vocabulary rather than translated. */
const HASHIA = "حاشیہ";
const TAKHREEJ = "تخريج";

/**
 * One narration, set as a page block: the number in a rubric medallion
 * straddling the frame edge, one pane per requested edition inside the jadwal,
 * the hashia under a foot-rule, and the citation as apparatus beneath.
 *
 * Used by the baab reader, the continuous stream and the permalink, so it is
 * the component that has to get the corpus's holes right.
 */
export function HadithEntry({
  hadith,
  editions,
  book,
  variant = "list",
}: {
  hadith: Hadith;
  /** Editions in the order they were requested; drives face and direction. */
  editions: Edition[];
  /** Needed to cite the hadith the way a reader would write it. */
  book?: Book;
  /** The permalink shows the full apparatus; a list stays denser. */
  variant?: "list" | "single";
}) {
  const variantLetter =
    hadith.subNumber > 0 ? String.fromCharCode(64 + hadith.subNumber) : null;
  const citation = citationOf(hadith, book?.slug);

  return (
    <article id={hadith.uci} className="relative scroll-mt-28">
      {/* Marginal number: inline on narrow screens, straddling the rule above sm. */}
      <div className="mb-3 flex items-center gap-3 sm:absolute sm:top-7 sm:left-14 sm:z-10 sm:mb-0 sm:-translate-x-1/2">
        <Medallion number={hadith.number} variantLetter={variantLetter} />
      </div>

      <div className="sm:pl-14">
        <Jadwal className="px-5 py-6 sm:px-9 sm:py-8">
          {editions.map((edition, index) => {
            const text = textFor(hadith, edition.slug);
            const isOriginal = edition.type === "original";

            return (
              <div
                key={edition.uci}
                className={
                  index > 0 ? "mt-7 border-t border-jadwal pt-7" : undefined
                }
              >
                {text ? (
                  <>
                    <CorpusText
                      lang={edition.language}
                      size={isOriginal ? "matn" : "body"}
                      tone={isOriginal ? "ink" : "ink-2"}
                    >
                      {text.text}
                    </CorpusText>

                    {text.footnote ? (
                      <div className="mt-6">
                        <div
                          aria-hidden="true"
                          className="ml-auto h-px w-1/3 bg-jadwal"
                        />
                        <CorpusText
                          lang={edition.language}
                          size="note"
                          tone="ink-3"
                          className="mt-3"
                          prefix={HASHIA}
                        >
                          {text.footnote}
                        </CorpusText>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    glyph={null}
                    title={`This narration has no ${edition.name} text.`}
                    detail="A few narrations were never set in this edition."
                    className="py-2"
                  />
                )}
              </div>
            );
          })}
        </Jadwal>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 sm:pl-14">
        {hadith.grade ? <GradeMark grade={hadith.grade} /> : null}
        <Link
          href={hadithHref(hadith.uci)}
          className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase transition-colors hover:text-rubric focus-visible:text-rubric"
        >
          {hadith.uci}
        </Link>
        {citation.human ? (
          <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-ink-3 uppercase">
            {citation.human}
          </span>
        ) : null}
      </div>

      {variant === "single" && hadith.takhreej ? (
        <div className="mt-6 sm:pl-14">
          <Eyebrow>{`Takhreej — cross-references`}</Eyebrow>
          <CorpusText
            lang="ar"
            size="note"
            tone="ink-3"
            className="mt-2"
            prefix={TAKHREEJ}
          >
            {hadith.takhreej}
          </CorpusText>
        </div>
      ) : null}
    </article>
  );
}
