import { sql } from 'drizzle-orm';
import { check, pgTable, smallint, text } from 'drizzle-orm/pg-core';

/**
 * UCI (Unique Content Identifier) prefix registry — `H` corpus (Hadees project).
 *
 * This is the CANONICAL registry for the `H` corpus. Every content entity in
 * this project has a UCI text primary key of the form:
 *
 *   <2 alphabetic chars><number>   (only the first two chars may be letters)
 *
 * The first letter is always `H` (this project owns the entire `H` namespace,
 * the way the Quran project owns `Q`). The second letter identifies the entity.
 *
 * Structural prefixes:
 *   HZ  Book                      HZ1–HZ15, canonical six first
 *   HK  Kitab (chapter)           global sequential = reading order
 *   HY  Baab (section)            global sequential = reading order
 *   HE  Edition                   HE1 ar-vocalized, HE2 ur-darussalam
 *   HX  Hadith text (composite)   'HX' + edition number
 *                                      + book number zero-padded to 2
 *                                      + hadith number zero-padded to 5
 *                                 e.g. HX20100100 = edition 2, book 01
 *                                 (Bukhari), hadith 100. The last 5 digits are
 *                                 always the hadith number, the 2 before it the
 *                                 book number, the rest the edition number.
 *
 * Hadith prefixes — one per book, hadith number within the book. A few source
 * hadiths are variant narrations with dotted numbers ('270.1'); their UCIs
 * append a variant letter instead of the dot ('HA270A' = variant 1 of #270,
 * 'B' = variant 2, ...; texts get 'HX10700270A' — strip the optional trailing
 * letter before fixed-width parsing).
 *   HB  Sahih Bukhari                      HB100  = Bukhari #100
 *   HM  Sahih Muslim
 *   HD  Sunan Abu Dawood
 *   HT  Jami Tirmizi
 *   HN  Sunan Nisai
 *   HI  Sunan Ibn-e-Maja
 *   HA  Al-Adab Al-Mufarrad
 *   HG  Buloogh al-Maram
 *   HL  Lolo wal Marjan
 *   HC  Shumail-e-Tirmidhi
 *   HS  Mujam as-Sagheer Tibrani
 *   HR  Masnad Abdullah bin Mubarak
 *   HU  Masnad Abdullah bin Umar
 *   HF  Masnad Abdul Rahman bin Auf
 *   HQ  Masnad Ishaq bin Rahwiya
 *
 * Free letters for future book collections: H, J, O, P, V, W.
 * If the corpus ever grows past those, a second corpus letter will be claimed
 * and registered here — prefixes are frozen once published, never renamed.
 */
export const books = pgTable(
  'books',
  {
    uci: text('uci').primaryKey(), // 'HZ' || number
    number: smallint('number').notNull().unique(),
    hadithPrefix: text('hadith_prefix').notNull().unique(), // 'HB', 'HM', ...
    slug: text('slug').notNull().unique(), // 'bukhari', 'abu-dawood'
    nameArabic: text('name_arabic').notNull(),
    nameUrdu: text('name_urdu').notNull(),
  },
  (t) => [
    check('books_uci_check', sql`${t.uci} = 'HZ' || ${t.number}`),
    check('books_hadith_prefix_check', sql`${t.hadithPrefix} ~ '^H[A-Z]$'`),
  ],
);

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
