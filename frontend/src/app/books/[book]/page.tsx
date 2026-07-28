import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Crumbs } from "@/components/crumbs";
import { Fihrist } from "@/components/fihrist";
import { PageHeader } from "@/components/page-header";
import {
  getBookKitabs,
  getBookNarrationCounts,
  getBooks,
  orNull,
  getBook,
} from "@/lib/api/client";
import { kitabHref, pluralize } from "@/lib/hadees";

type Params = { book: string };

export async function generateStaticParams(): Promise<Params[]> {
  const books = await getBooks();
  return books.map((book) => ({ book: book.slug }));
}

/**
 * The corpus is a closed set of fifteen collections, all prerendered above, so
 * a slug outside that set is rejected before the page renders. That is what
 * earns a real 404 here — once a response starts streaming Next cannot change
 * the status code.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { book: slug } = await params;
  const book = await orNull(getBook(slug));
  if (!book) return { title: "Collection not found" };

  return {
    title: book.nameArabic,
    description: `Browse ${book.nameUrdu} (${book.nameArabic}) by kitab and baab, in vocalized Arabic with the Dar-us-Salam Urdu translation.`,
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { book: slug } = await params;

  const book = await orNull(getBook(slug));
  if (!book) notFound();

  const [kitabs, counts] = await Promise.all([
    getBookKitabs(book.slug),
    getBookNarrationCounts(),
  ]);
  const narrations = counts.get(book.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Crumbs
        items={[{ label: "Collections", href: "/" }, { label: book.slug }]}
      />

      <PageHeader
        eyebrow={`${book.hadithPrefix} · ${book.uci}`}
        titleArabic={book.nameArabic}
        titleUrdu={book.nameUrdu}
        meta={`${pluralize(kitabs.length, "kitab")}${
          narrations === undefined
            ? ""
            : ` · ${pluralize(narrations, "narration")}`
        }`}
        className="mt-6"
      >
        <Link
          href={`/hadiths?book=${book.slug}`}
          className="font-mono text-[0.6875rem] tracking-[0.16em] text-rubric uppercase underline decoration-rubric/40 underline-offset-4 transition-colors hover:decoration-rubric"
        >
          Read straight through ›
        </Link>
      </PageHeader>

      <section className="mt-10">
        <Fihrist
          items={kitabs.map((kitab) => ({
            key: kitab.uci,
            number: kitab.numberInBook,
            nameArabic: kitab.nameArabic,
            nameUrdu: kitab.nameUrdu,
            href: kitabHref(book.slug, kitab.numberInBook),
          }))}
          emptyTitle="This collection has no kitabs catalogued."
          emptyDetail="Read it straight through instead."
        />
      </section>
    </div>
  );
}
