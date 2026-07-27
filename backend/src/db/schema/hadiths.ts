import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { baabs } from './baabs';
import { books } from './books';
import { kitabs } from './kitabs';

/**
 * Hadith — structure and scholarly metadata only; the text of a hadith lives
 * in `hadith_texts`, one row per edition.
 *
 * The UCI is the owning book's hadith prefix followed by the hadith's number
 * within that book (e.g. 'HB100' = Bukhari #100). Referencing the book through
 * its `hadith_prefix` lets a plain CHECK constraint enforce the full UCI.
 *
 * A handful of hadiths are variant narrations carrying a dotted source number
 * ('270.1'); those get `subNumber` > 0 and a letter-suffixed UCI ('HA270A',
 * subNumber 1 = A, 2 = B, ...). Regular hadiths have `subNumber` 0 and a
 * plain numeric UCI.
 */
export const hadiths = pgTable(
  'hadiths',
  {
    uci: text('uci').primaryKey(), // prefix || number [+ 'A'/'B'/... variant]
    bookPrefix: text('book_prefix')
      .notNull()
      .references(() => books.hadithPrefix),
    kitabUci: text('kitab_uci')
      .notNull()
      .references(() => kitabs.uci),
    baabUci: text('baab_uci')
      .notNull()
      .references(() => baabs.uci),
    number: integer('number').notNull(), // hadith number within its book
    subNumber: smallint('sub_number').notNull().default(0),
    grade: text('grade'), // صحيح / حسن / ضعيف ... (free text)
    takhreej: text('takhreej'), // cross-references to other collections
  },
  (t) => [
    unique('hadiths_book_number_unique').on(t.bookPrefix, t.number, t.subNumber),
    check(
      'hadiths_uci_check',
      sql`${t.uci} = ${t.bookPrefix} || ${t.number} || CASE WHEN ${t.subNumber} = 0 THEN '' ELSE chr(64 + ${t.subNumber}) END`,
    ),
    index('idx_hadiths_book').on(t.bookPrefix),
    index('idx_hadiths_kitab').on(t.kitabUci),
    index('idx_hadiths_baab').on(t.baabUci),
  ],
);

export type Hadith = typeof hadiths.$inferSelect;
export type NewHadith = typeof hadiths.$inferInsert;
