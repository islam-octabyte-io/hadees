import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { Fihrist } from "@/components/fihrist";
import { PageHeader } from "@/components/page-header";
import { PrevNextNav } from "@/components/prev-next-nav";
import {
  getBook,
  getBookKitabs,
  getBooks,
  getKitab,
  getKitabBaabs,
  getKitabHadiths,
  orNull,
} from "@/lib/api/client";
import {
  baabHref,
  composeIdentifier,
  kitabHref,
  pluralize,
} from "@/lib/hadees";

type Params = { book: string; kitab: string };

/**
 * All 503 kitabs are enumerable, so they are prerendered and anything outside
 * the set is rejected before rendering — which is what earns a real 404 status.
 * Baabs (14,749) and narrations (41,998) are too numerous for the same
 * treatment and stay dynamic.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const books = await getBooks();
  const perBook = await Promise.all(
    books.map(async (book) => {
      const kitabs = await getBookKitabs(book.slug);
      return kitabs.map((kitab) => ({
        book: book.slug,
        kitab: String(kitab.numberInBook),
      }));
    }),
  );
  return perBook.flat();
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug, kitab: number } = await params;
  const kitab = await orNull(getKitab(composeIdentifier(slug, number)));
  if (!kitab) return { title: "Kitab not found" };

  return {
    title: kitab.nameArabic ?? `Kitab ${kitab.numberInBook}`,
    description: kitab.nameUrdu ?? undefined,
  };
}

export default async function KitabPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug, kitab: number } = await params;
  const identifier = composeIdentifier(slug, number);

  const [book, kitab] = await Promise.all([
    orNull(getBook(slug)),
    orNull(getKitab(identifier)),
  ]);
  if (!book || !kitab) notFound();

  const [baabs, siblings, narrations] = await Promise.all([
    getKitabBaabs(identifier),
    getBookKitabs(book.slug),
    getKitabHadiths(identifier, { limit: 1 }).then((page) => page.meta.total),
  ]);

  const position = siblings.findIndex((k) => k.uci === kitab.uci);
  const previous = position > 0 ? siblings[position - 1] : null;
  const next =
    position >= 0 && position < siblings.length - 1
      ? siblings[position + 1]
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Crumbs
        items={[
          { label: "Collections", href: "/" },
          { label: book.slug, href: `/books/${book.slug}` },
          { label: `Kitab ${kitab.numberInBook}` },
        ]}
      />

      <PageHeader
        eyebrow={`Kitab ${kitab.numberInBook} of ${book.slug} · ${kitab.uci}`}
        titleArabic={kitab.nameArabic}
        titleUrdu={kitab.nameUrdu}
        titleFallback={`Kitab ${kitab.numberInBook}`}
        meta={`${pluralize(baabs.length, "baab")} · ${pluralize(narrations, "narration")}`}
        className="mt-6"
      >
        <Link
          href={`/hadiths?kitab=${kitab.uci}`}
          className="font-mono text-[0.6875rem] tracking-[0.16em] text-rubric uppercase underline decoration-rubric/40 underline-offset-4 transition-colors hover:decoration-rubric"
        >
          Read this kitab straight through ›
        </Link>
      </PageHeader>

      <section className="mt-10">
        <Fihrist
          items={baabs.map((baab) => ({
            key: baab.uci,
            number: baab.numberInKitab,
            nameArabic: baab.nameArabic,
            nameUrdu: baab.nameUrdu,
            href: baabHref(book.slug, kitab.numberInBook, baab.numberInKitab),
          }))}
          emptyTitle="This kitab has no baabs catalogued."
          emptyDetail="Read it straight through instead."
        />
      </section>

      <div className="mt-12">
        <PrevNextNav
          previous={
            previous
              ? {
                  href: kitabHref(book.slug, previous.numberInBook),
                  label:
                    previous.nameArabic ?? `Kitab ${previous.numberInBook}`,
                  lang: previous.nameArabic ? "ar" : undefined,
                }
              : null
          }
          next={
            next
              ? {
                  href: kitabHref(book.slug, next.numberInBook),
                  label: next.nameArabic ?? `Kitab ${next.numberInBook}`,
                  lang: next.nameArabic ? "ar" : undefined,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
