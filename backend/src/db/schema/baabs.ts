import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgTable,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { kitabs } from './kitabs';

/**
 * Baab — the section level inside a kitab (e.g. باب كيف يقبض العلم).
 * UCI prefix `HY`; `number` is a global sequence assigned in reading order at
 * seed time, so it doubles as the browse sort order.
 *
 * `sourceId` is the source db's BaabHiddenID, which distinguishes sub-baabs
 * ('57.1' vs '57'); books whose BaabHiddenID is empty fall back to BaabID.
 */
export const baabs = pgTable(
  'baabs',
  {
    uci: text('uci').primaryKey(), // 'HY' || number
    number: integer('number').notNull().unique(), // global, reading order
    kitabUci: text('kitab_uci')
      .notNull()
      .references(() => kitabs.uci),
    sourceId: text('source_id').notNull(),
    numberInKitab: smallint('number_in_kitab').notNull(),
    nameArabic: text('name_arabic'),
    nameUrdu: text('name_urdu'),
  },
  (t) => [
    unique('baabs_kitab_source_unique').on(t.kitabUci, t.sourceId),
    unique('baabs_kitab_number_unique').on(t.kitabUci, t.numberInKitab),
    check('baabs_uci_check', sql`${t.uci} = 'HY' || ${t.number}`),
  ],
);

export type Baab = typeof baabs.$inferSelect;
export type NewBaab = typeof baabs.$inferInsert;
