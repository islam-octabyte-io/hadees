import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { editions } from './editions';
import { hadiths } from './hadiths';

/**
 * Hadith text — the actual text of a hadith in one edition.
 *
 * Composite UCI (see the registry in books.ts):
 *   'HX' + edition number + book number (2 digits) + hadith number (5 digits)
 *   HX20100100 = edition 2, book 01 (Bukhari), hadith 100
 * Variant narrations append the hadith's variant letter ('HX10700270A');
 * strip the optional trailing letter before applying the fixed-width parse.
 *
 * The SQL CHECK enforces the shape; the exact composite (edition/book/hadith
 * digits matching the FKs) is guaranteed by the seed and re-verified by the
 * verification pass at the end of seeding, Quran-project style.
 *
 * `textPlain` is the search-normalized variant (diacritics-stripped Arabic /
 * cleaned Urdu) and carries the pg_trgm GIN index; `footnote` is per-edition
 * commentary (the Urdu Hashia lives on HE2 rows).
 */
export const hadithTexts = pgTable(
  'hadith_texts',
  {
    uci: text('uci').primaryKey(),
    hadithUci: text('hadith_uci')
      .notNull()
      .references(() => hadiths.uci),
    editionUci: text('edition_uci')
      .notNull()
      .references(() => editions.uci),
    text: text('text').notNull(), // display text
    textPlain: text('text_plain').notNull(), // normalized for search
    footnote: text('footnote'),
  },
  (t) => [
    unique('hadith_texts_hadith_edition_unique').on(t.hadithUci, t.editionUci),
    check('hadith_texts_uci_check', sql`${t.uci} ~ '^HX[0-9]{8,}[A-Z]?$'`),
    index('idx_texts_hadith').on(t.hadithUci),
    index('idx_texts_edition').on(t.editionUci),
    index('idx_texts_plain_trgm').using(
      'gin',
      sql`${t.textPlain} gin_trgm_ops`,
    ),
  ],
);

export type HadithText = typeof hadithTexts.$inferSelect;
export type NewHadithText = typeof hadithTexts.$inferInsert;
