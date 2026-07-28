import { EmptyState } from "@/components/empty-state";
import { HadithEntry } from "@/components/hadith-entry";
import type { Book, Edition, Hadith } from "@/lib/api/client";

/** A run of narrations, generously spaced so each page block reads as one. */
export function HadithList({
  hadiths,
  editions,
  booksByPrefix,
}: {
  hadiths: Hadith[];
  editions: Edition[];
  /** Keyed by `hadithPrefix`, since that is all a HadithDto carries. */
  booksByPrefix: Map<string, Book>;
}) {
  if (hadiths.length === 0) {
    return (
      <EmptyState
        title="No narrations here."
        detail="This section is catalogued but its narrations are not in the corpus."
      />
    );
  }

  return (
    <ol className="space-y-12 sm:space-y-16">
      {hadiths.map((hadith) => (
        <li key={hadith.uci}>
          <HadithEntry
            hadith={hadith}
            editions={editions}
            book={booksByPrefix.get(hadith.bookPrefix)}
          />
        </li>
      ))}
    </ol>
  );
}
