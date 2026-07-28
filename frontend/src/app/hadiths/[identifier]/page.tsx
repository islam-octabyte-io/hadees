import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { EditionPicker } from "@/components/edition-picker";
import { HadithEntry } from "@/components/hadith-entry";
import { PageHeader } from "@/components/page-header";
import { PrevNextNav } from "@/components/prev-next-nav";
import {
  getBaab,
  getBaabHadiths,
  getBookIndex,
  getEditions,
  getHadith,
  getKitab,
  orNull,
} from "@/lib/api/client";
import {
  baabHref,
  decodeIdentifier,
  hadithHref,
  kitabHref,
  resolveEditions,
} from "@/lib/hadees";

type Params = { identifier: string };
type Query = { edition?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const hadith = await orNull(getHadith(decodeIdentifier(identifier)));
  if (!hadith) return { title: "Narration not found" };

  const { byPrefix } = await getBookIndex();
  const book = byPrefix.get(hadith.bookPrefix);

  return {
    title: book ? `${book.nameArabic} ${hadith.number}` : hadith.uci,
    description: book
      ? `Narration ${hadith.number} of ${book.nameUrdu} (${hadith.uci}), in vocalized Arabic with the Dar-us-Salam Urdu translation.`
      : undefined,
    // The API accepts several forms for the same narration, so the UCI is
    // declared canonical rather than redirected to: the page is identical and
    // a redirect would only cost a round trip.
    alternates: { canonical: hadithHref(hadith.uci) },
  };
}

export default async function HadithPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Query>;
}) {
  const [{ identifier }, query] = await Promise.all([params, searchParams]);

  const allEditions = await getEditions();
  const editions = resolveEditions(allEditions, query.edition);
  const editionParam = editions.map((e) => e.slug).join(",");

  const hadith = await orNull(
    getHadith(decodeIdentifier(identifier), editionParam),
  );
  if (!hadith) notFound();

  const [{ byPrefix }, kitab, baab, baabHadiths] = await Promise.all([
    getBookIndex(),
    orNull(getKitab(hadith.kitabUci)),
    orNull(getBaab(hadith.baabUci)),
    getBaabHadiths(hadith.baabUci, { limit: 100, edition: editionParam }),
  ]);

  const book = byPrefix.get(hadith.bookPrefix);

  // Reading order inside the baab is the natural unit to step through.
  const position = baabHadiths.data.findIndex((h) => h.uci === hadith.uci);
  const previous = position > 0 ? baabHadiths.data[position - 1] : null;
  const next =
    position >= 0 && position < baabHadiths.data.length - 1
      ? baabHadiths.data[position + 1]
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Crumbs
        items={[
          { label: "Collections", href: "/" },
          ...(book ? [{ label: book.slug, href: `/books/${book.slug}` }] : []),
          ...(book && kitab
            ? [
                {
                  label: kitab.nameArabic ?? `Kitab ${kitab.numberInBook}`,
                  href: kitabHref(book.slug, kitab.numberInBook),
                  lang: kitab.nameArabic ? "ar" : undefined,
                },
              ]
            : []),
          ...(book && kitab && baab
            ? [
                {
                  label: baab.nameArabic ?? `Baab ${baab.numberInKitab}`,
                  href: baabHref(
                    book.slug,
                    kitab.numberInBook,
                    baab.numberInKitab,
                  ),
                  lang: baab.nameArabic ? "ar" : undefined,
                },
              ]
            : []),
          { label: hadith.uci },
        ]}
      />

      <PageHeader
        eyebrow={`${hadith.uci}${
          book ? ` · ${book.slug}:${hadith.number}` : ""
        }`}
        titleArabic={book?.nameArabic}
        titleUrdu={book?.nameUrdu}
        titleFallback={hadith.uci}
        meta={`One narration · ${editions.map((e) => e.name).join(" + ")}`}
        className="mt-6"
      >
        <EditionPicker
          editions={allEditions}
          active={editions.map((e) => e.slug)}
          query={query}
        />
      </PageHeader>

      <div className="mt-12">
        <HadithEntry
          hadith={hadith}
          editions={editions}
          book={book}
          variant="single"
        />
      </div>

      <div className="mt-14">
        <PrevNextNav
          previous={
            previous
              ? { href: hadithHref(previous.uci), label: previous.uci }
              : null
          }
          next={next ? { href: hadithHref(next.uci), label: next.uci } : null}
        />
      </div>
    </div>
  );
}
