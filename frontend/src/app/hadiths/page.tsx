import type { Metadata } from "next";

import { Crumbs } from "@/components/crumbs";
import { EditionPicker } from "@/components/edition-picker";
import { EmptyState } from "@/components/empty-state";
import { HadithList } from "@/components/hadith-list";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import {
  getBaab,
  getBook,
  getBookIndex,
  getEditions,
  getHadiths,
  getKitab,
  orNull,
} from "@/lib/api/client";
import { pluralize, resolveEditions } from "@/lib/hadees";

type Query = {
  page?: string;
  edition?: string;
  book?: string;
  kitab?: string;
  baab?: string;
};

const PER_PAGE = 20;

export const metadata: Metadata = {
  title: "Read through",
  description:
    "Read the hadith corpus straight through in canonical order, in vocalized Arabic with the Dar-us-Salam Urdu translation.",
};

export default async function HadithsPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const allEditions = await getEditions();
  const editions = resolveEditions(allEditions, query.edition);

  // Resolve whichever filter is set, so the heading can name it and a bad
  // filter reads as "no such thing" rather than an error page.
  const [book, kitab, baab] = await Promise.all([
    query.book ? orNull(getBook(query.book)) : null,
    query.kitab ? orNull(getKitab(query.kitab)) : null,
    query.baab ? orNull(getBaab(query.baab)) : null,
  ]);

  const filterMissing =
    (query.book && !book) || (query.kitab && !kitab) || (query.baab && !baab);

  if (filterMissing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Crumbs
          items={[
            { label: "Collections", href: "/" },
            { label: "Read through" },
          ]}
        />
        <EmptyState
          className="mt-16"
          title="That filter matches nothing in the corpus."
          detail="Check the collection, kitab or baab identifier and try again."
        />
      </div>
    );
  }

  const hadiths = await getHadiths({
    page,
    limit: PER_PAGE,
    edition: editions.map((e) => e.slug).join(","),
    book: query.book,
    kitab: query.kitab,
    baab: query.baab,
  });

  const { byPrefix } = await getBookIndex();

  const hrefForPage = (target: number) => {
    const search = new URLSearchParams();
    if (query.book) search.set("book", query.book);
    if (query.kitab) search.set("kitab", query.kitab);
    if (query.baab) search.set("baab", query.baab);
    if (query.edition) search.set("edition", query.edition);
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return suffix ? `/hadiths?${suffix}` : "/hadiths";
  };

  const scope = baab?.uci ?? kitab?.uci ?? book?.slug ?? "the whole corpus";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Crumbs
        items={[
          { label: "Collections", href: "/" },
          ...(book ? [{ label: book.slug, href: `/books/${book.slug}` }] : []),
          { label: "Read through" },
        ]}
      />

      <PageHeader
        eyebrow={`Reading through ${scope}`}
        titleArabic={
          baab?.nameArabic ??
          kitab?.nameArabic ??
          book?.nameArabic ??
          "الأحاديث"
        }
        titleUrdu={baab?.nameUrdu ?? kitab?.nameUrdu ?? book?.nameUrdu ?? null}
        meta={`${pluralize(hadiths.meta.total, "narration")} · ${editions
          .map((e) => e.name)
          .join(" + ")}`}
        className="mt-6"
      >
        <EditionPicker
          editions={allEditions}
          active={editions.map((e) => e.slug)}
          query={query}
        />
      </PageHeader>

      <div className="mt-12">
        <HadithList
          hadiths={hadiths.data}
          editions={editions}
          booksByPrefix={byPrefix}
        />
      </div>

      <Pager meta={hadiths.meta} hrefForPage={hrefForPage} className="mt-14" />
    </div>
  );
}
