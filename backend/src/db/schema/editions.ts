import { sql } from 'drizzle-orm';
import { check, pgEnum, pgTable, smallint, text } from 'drizzle-orm/pg-core';

export const editionType = pgEnum('edition_type', [
  'original',
  'translation',
  'transliteration',
]);

/**
 * Edition — one rendering of the corpus text (the vocalized Arabic original,
 * a translation, ...). Adding an edition never touches structural tables:
 * one `editions` row plus one `hadith_texts` row per hadith.
 *
 * Seeded: HE1 `ar-vocalized` (original), HE2 `ur-darussalam` (translation).
 */
export const editions = pgTable(
  'editions',
  {
    uci: text('uci').primaryKey(), // 'HE' || number
    number: smallint('number').notNull().unique(),
    slug: text('slug').notNull().unique(), // human-readable API handle
    name: text('name').notNull(),
    language: text('language').notNull(), // 'ar', 'ur'
    type: editionType('type').notNull(),
  },
  (t) => [check('editions_uci_check', sql`${t.uci} = 'HE' || ${t.number}`)],
);

export type Edition = typeof editions.$inferSelect;
export type NewEdition = typeof editions.$inferInsert;
