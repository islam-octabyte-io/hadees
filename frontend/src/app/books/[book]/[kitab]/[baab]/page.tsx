import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { EditionPicker } from "@/components/edition-picker";
import { HadithList } from "@/components/hadith-list";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { PrevNextNav } from "@/components/prev-next-nav";
import {
  getBaab,
  getBaabHadiths,
  getBook,
  getBookIndex,
  getEditions,
  getKitab,
  getKitabBaabs,
  orNull,
} from "@/lib/api/client";
import {
  baabHref,
  composeIdentifier,
  pluralize,
  resolveEditions,
} from "@/lib/hadees";

type Params = { book: string; kitab: string; baab: string };
type Query = { page?: string; edition?: string };

const PER_PAGE = 25;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug, kitab, baab } = await params;
  const found = await orNull(getBaab(composeIdentifier(slug, kitab, baab)));
  if (!found) return { title: "Baab not found" };

  return {
    title: found.nameArabic ?? `Baab ${found.numberInKitab}`,
    description: found.nameUrdu ?? undefined,
  };
}

export default async function BaabPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Query>;
}) {
  const [{ book: slug, kitab: kitabNumber, baab: baabNumber }, query] =
    await Promise.all([params, searchParams]);

  const kitabIdentifier = composeIdentifier(slug, kitabNumber);
  const baabIdentifier = composeIdentifier(slug, kitabNumber, baabNumber);
  const page = Number(query.page) > 0 ? Number(query.page) : 1;

  const [book, kitab, baab, allEditions] = await Promise.all([
    orNull(getBook(slug)),
    orNull(getKitab(kitabIdentifier)),
    orNull(getBaab(baabIdentifier)),
    getEditions(),
  ]);
  if (!book || !kitab || !baab) notFound();

  const editions = resolveEditions(allEditions, query.edition);

  const [hadiths, siblings, { byPrefix }] = await Promise.all([
    getBaabHadiths(baabIdentifier, {
      page,
      limit: PER_PAGE,
      edition: editions.map((e) => e.slug).join(","),
    }),
    getKitabBaabs(kitabIdentifier),
    getBookIndex(),
  ]);

  const position = siblings.findIndex((b) => b.uci === baab.uci);
  const previous = position > 0 ? siblings[position - 1] : null;
  const next =
    position >= 0 && position < siblings.length - 1
      ? siblings[position + 1]
      : null;

  const hrefForPage = (target: number) => {
    const search = new URLSearchParams();
    if (target > 1) search.set("page", String(target));
    if (query.edition) search.set("edition", query.edition);
    const suffix = search.toString();
    return suffix
      ? `${baabHref(book.slug, kitab.numberInBook, baab.numberInKitab)}?${suffix}`
      : baabHref(book.slug, kitab.numberInBook, baab.numberInKitab);
  };

  const targetFor = (sibling: typeof previous) =>
    sibling
      ? {
          href: baabHref(book.slug, kitab.numberInBook, sibling.numberInKitab),
          label: sibling.nameArabic ?? `Baab ${sibling.numberInKitab}`,
          lang: sibling.nameArabic ? "ar" : undefined,
        }
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Crumbs
        items={[
          { label: "Collections", href: "/" },
          { label: book.slug, href: `/books/${book.slug}` },
          {
            label: kitab.nameArabic ?? `Kitab ${kitab.numberInBook}`,
            href: `/books/${book.slug}/${kitab.numberInBook}`,
            lang: kitab.nameArabic ? "ar" : undefined,
          },
          { label: `Baab ${baab.numberInKitab}` },
        ]}
      />

      <PageHeader
        eyebrow={`${baab.uci} · ${book.slug}:${kitab.numberInBook}:${baab.numberInKitab}`}
        titleArabic={baab.nameArabic}
        titleUrdu={baab.nameUrdu}
        titleFallback={`Baab ${baab.numberInKitab}`}
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

      <div className="mt-12">
        <PrevNextNav previous={targetFor(previous)} next={targetFor(next)} />
      </div>
    </div>
  );
}
