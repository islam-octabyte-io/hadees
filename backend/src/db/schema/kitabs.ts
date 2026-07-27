import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { books } from './books';

/**
 * Kitab — the chapter level of a book (e.g. كتاب العلم).
 * UCI prefix `HK`; `number` is a global sequence assigned in reading order at
 * seed time, so it doubles as the browse sort order.
 *
 * `sourceId` is text because sub-kitabs exist ('1.1' in lolo-walmarjan).
 */
export const kitabs = pgTable(
  'kitabs',
  {
    uci: text('uci').primaryKey(), // 'HK' || number
    number: integer('number').notNull().unique(), // global, reading order
    bookUci: text('book_uci')
      .notNull()
      .references(() => books.uci),
    sourceId: text('source_id').notNull(), // KitabID in the source SQLite
    numberInBook: smallint('number_in_book').notNull(),
    nameArabic: text('name_arabic'),
    nameUrdu: text('name_urdu'),
  },
  (t) => [
    unique('kitabs_book_source_unique').on(t.bookUci, t.sourceId),
    unique('kitabs_book_number_unique').on(t.bookUci, t.numberInBook),
    check('kitabs_uci_check', sql`${t.uci} = 'HK' || ${t.number}`),
  ],
);

export type Kitab = typeof kitabs.$inferSelect;
export type NewKitab = typeof kitabs.$inferInsert;
