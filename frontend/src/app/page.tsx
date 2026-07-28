import { BookPlate } from "@/components/book-plate";
import { Eyebrow } from "@/components/eyebrow";
import { LookupBar, LookupHint } from "@/components/lookup-bar";
import { ScriptText } from "@/components/script-text";
import {
  getBookNarrationCounts,
  getBooks,
  getCorpusTotal,
} from "@/lib/api/client";
import { pluralize } from "@/lib/hadees";

/** The six canonically-sahih collections lead the corpus; the API orders them first. */
const SAHIH_COUNT = 6;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lookup?: string }>;
}) {
  const [{ lookup }, books, counts, total] = await Promise.all([
    searchParams,
    getBooks(),
    getBookNarrationCounts(),
    getCorpusTotal(),
  ]);

  const sahih = books.slice(0, SAHIH_COUNT);
  const rest = books.slice(SAHIH_COUNT);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Eyebrow>
        {`${pluralize(books.length, "collection")} · ${pluralize(total, "narration")} · Arabic & Urdu`}
      </Eyebrow>

      <ScriptText lang="ar" as="h1" size="display" className="mt-4">
        الكتب الستة
      </ScriptText>
      <p className="mt-3 max-w-prose text-sm text-ink-3">
        The six collections Sunni scholarship treats as canonical, followed by
        nine more. Every narration is set in vocalized Arabic with the
        Dar-us-Salam Urdu translation beneath it.
      </p>

      <div className="mt-8">
        <LookupBar />
        <LookupHint className="mt-2" />
        {lookup ? <LookupMiss query={lookup} /> : null}
      </div>

      <div className="mt-12 grid gap-px border border-jadwal bg-jadwal sm:grid-cols-2 lg:grid-cols-3">
        {sahih.map((book, index) => (
          <div
            key={book.uci}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{
              animationDelay: `${index * 60}ms`,
              animationFillMode: "both",
            }}
          >
            <BookPlate
              book={book}
              narrations={counts.get(book.slug)}
              variant="sahih"
            />
          </div>
        ))}
      </div>

      <section className="mt-16">
        <Eyebrow as="h2">The rest of the corpus</Eyebrow>
        <div className="mt-4 border-t border-jadwal">
          {rest.map((book) => (
            <BookPlate
              key={book.uci}
              book={book}
              narrations={counts.get(book.slug)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Shown when a typed citation resolved to nothing. Says what to type instead. */
function LookupMiss({ query }: { query: string }) {
  return (
    <div className="mt-5 border-l-2 border-rubric pl-4">
      <p className="font-mono text-[0.6875rem] tracking-[0.16em] text-rubric uppercase">
        Not found
      </p>
      <p className="mt-1 text-sm text-ink-3">
        Nothing in the corpus is addressed by{" "}
        <span className="font-mono text-foreground">{query}</span>. Try a
        collection and number, like{" "}
        <span className="font-mono text-foreground">bukhari:100</span>.
      </p>
    </div>
  );
}
