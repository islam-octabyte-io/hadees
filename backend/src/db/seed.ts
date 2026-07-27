/**
 * Seed the hadees Postgres database from the 15 source SQLite files in
 * `data-collection/`. Idempotent: truncates all content tables and rebuilds.
 *
 *   pnpm --filter backend db:seed
 *
 * Requires DATABASE_URL (see .env) and the pg_trgm extension (created here).
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as path from 'node:path';
import { Pool } from 'pg';
import {
  baabs,
  books,
  editions,
  hadiths,
  hadithTexts,
  type NewBaab,
  type NewBook,
  type NewHadith,
  type NewHadithText,
  type NewKitab,
  kitabs,
} from './schema';

const DATA_DIR = path.resolve(__dirname, '../../../data-collection');

/**
 * Canonical book list. Order is meaningful: `number` drives HZ UCIs and the
 * HX composite; the canonical six come first. Prefixes are frozen — see the
 * UCI registry in schema/books.ts.
 *
 * Names are hardcoded because the source columns are unreliable (muslim.db
 * mislabels its own Urdu name on every row, others say 'Book' or are empty);
 * Urdu names follow each source db's metadata table.
 */
const BOOKS = [
  {
    number: 1,
    prefix: 'HB',
    slug: 'bukhari',
    file: 'bukhari.db',
    nameArabic: 'صحيح البخاري',
    nameUrdu: 'صحیح بخاری',
  },
  {
    number: 2,
    prefix: 'HM',
    slug: 'muslim',
    file: 'muslim.db',
    nameArabic: 'صحيح مسلم',
    nameUrdu: 'صحیح مسلم',
  },
  {
    number: 3,
    prefix: 'HD',
    slug: 'abu-dawood',
    file: 'abu-dawood.db',
    nameArabic: 'سنن أبي داود',
    nameUrdu: 'سنن ابی داؤد',
  },
  {
    number: 4,
    prefix: 'HT',
    slug: 'tirmizi',
    file: 'tirmizi.db',
    nameArabic: 'جامع الترمذي',
    nameUrdu: 'جامع ترمذی',
  },
  {
    number: 5,
    prefix: 'HN',
    slug: 'nisai',
    file: 'nisai.db',
    nameArabic: 'سنن النسائي',
    nameUrdu: 'سنن نسائی',
  },
  {
    number: 6,
    prefix: 'HI',
    slug: 'ibn-e-maja',
    file: 'ibn-e-maja.db',
    nameArabic: 'سنن ابن ماجه',
    nameUrdu: 'سنن ابن ماجہ',
  },
  {
    number: 7,
    prefix: 'HA',
    slug: 'aladab-almufarrad',
    file: 'aladab-almufarrad.db',
    nameArabic: 'الأدب المفرد',
    nameUrdu: 'الادب المفرد',
  },
  {
    number: 8,
    prefix: 'HG',
    slug: 'buloogh-al-maram',
    file: 'buloogh-al-maram.db',
    nameArabic: 'بلوغ المرام من أدلة الأحكام',
    nameUrdu: 'بلوغ المرام',
  },
  {
    number: 9,
    prefix: 'HL',
    slug: 'lolo-walmarjan',
    file: 'lolo-walmarjan.db',
    nameArabic: 'اللؤلؤ والمرجان فيما اتفق عليه الشيخان',
    nameUrdu: 'اللؤلؤ و المرجان',
  },
  {
    number: 10,
    prefix: 'HC',
    slug: 'shumail-e-tirmidhi',
    file: 'shumail-e-tirmidhi.db',
    nameArabic: 'الشمائل المحمدية',
    nameUrdu: 'شمائل ترمذی',
  },
  {
    number: 11,
    prefix: 'HS',
    slug: 'mujam-as-sagheer-tibrani',
    file: 'mujam-as-sagheer-tibrani.db',
    nameArabic: 'المعجم الصغير للطبراني',
    nameUrdu: 'معجم صغیر طبرانی',
  },
  {
    number: 12,
    prefix: 'HR',
    slug: 'masnad-abdullah-bin-mubarak',
    file: 'masnad-abdullah-bin-mubarak.db',
    nameArabic: 'مسند عبد الله بن المبارك',
    nameUrdu: 'مسند عبدالله بن مبارک',
  },
  {
    number: 13,
    prefix: 'HU',
    slug: 'masnad-abdullah-bin-umar',
    file: 'masnad-abdullah-bin-umar.db',
    nameArabic: 'مسند عبد الله بن عمر',
    nameUrdu: 'مسند عبداللہ بن عمر',
  },
  {
    number: 14,
    prefix: 'HF',
    slug: 'masnad-abdul-rahman-bin-auf',
    file: 'masnad-abdul-rahman-bin-auf.db',
    nameArabic: 'مسند عبد الرحمن بن عوف',
    nameUrdu: 'مسند عبدالرحمٰن بن عوف',
  },
  {
    number: 15,
    prefix: 'HQ',
    slug: 'masnad-ishaq-bin-rahwiya',
    file: 'masnad-ishaq-bin-rahwiya.db',
    nameArabic: 'مسند إسحاق بن راهويه',
    nameUrdu: 'مسند اسحاق بن راہویہ',
  },
] as const;

const EDITIONS = [
  {
    number: 1,
    slug: 'ar-vocalized',
    name: 'Arabic (vocalized)',
    language: 'ar',
    type: 'original',
  },
  {
    number: 2,
    slug: 'ur-darussalam',
    name: 'Urdu — Dar-us-Salam',
    language: 'ur',
    type: 'translation',
  },
] as const;

interface SourceRow {
  ID: number;
  BookNameArabic: string | null;
  BookNameUrdu: string | null;
  KitabID: number | string; // sub-kitabs like '1.1' exist (lolo-walmarjan)
  KitaabNameArabic: string | null;
  KitaabNameUrdu: string | null;
  BaabID: number | string | null;
  BaabHiddenID: string | null;
  BaabNameArabic: string | null;
  BaabNameUrdu: string | null;
  HadeesNumber: number | string; // variant narrations are dotted ('270.1')
  HadithArabicText: string | null;
  HadithArabicTextSearch: string | null;
  HadithUrduText: string | null;
  HadithHashiaText: string | null;
  HadithHukamAjmali: string | null;
  HadithTakhreej: string | null;
  temp1?: string | null;
  temp?: string | null; // tirmizi names its temp1 column "temp"
}

/** Trim and strip stray zero-width/direction marks at the edges. */
function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const cleaned = value
    .replace(/^[​-‏‪-‮﻿\s]+/, '')
    .replace(/[​-‏‪-‮﻿\s]+$/, '');
  return cleaned.length > 0 ? cleaned : null;
}

/** '270.1' → { number: 270, subNumber: 1, suffix: 'A' } (1 = A, 2 = B, ...) */
function parseHadithNumber(raw: number | string): {
  number: number;
  subNumber: number;
  suffix: string;
} {
  const [intPart, fracPart] = String(raw).split('.');
  const subNumber = fracPart ? Number.parseInt(fracPart, 10) : 0;
  return {
    number: Number.parseInt(intPart, 10),
    subNumber,
    suffix: subNumber > 0 ? String.fromCharCode(64 + subNumber) : '',
  };
}

function textUci(
  editionNumber: number,
  bookNumber: number,
  hadithNumber: number,
  suffix: string,
): string {
  return `HX${editionNumber}${String(bookNumber).padStart(2, '0')}${String(
    hadithNumber,
  ).padStart(5, '0')}${suffix}`;
}

async function insertChunked<T>(
  insert: (chunk: T[]) => Promise<unknown>,
  rows: T[],
  chunkSize = 1000,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await insert(rows.slice(i, i + chunkSize));
  }
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const bookRows: NewBook[] = [];
  const kitabRows: NewKitab[] = [];
  const baabRows: NewBaab[] = [];
  const hadithRows: NewHadith[] = [];
  const textRows: NewHadithText[] = [];

  let kitabCounter = 0;
  let baabCounter = 0;

  for (const book of BOOKS) {
    const sqlite = new Database(path.join(DATA_DIR, book.file), {
      readonly: true,
    });
    const rows = sqlite
      .prepare('SELECT * FROM hadith ORDER BY ID')
      .all() as SourceRow[];
    sqlite.close();

    if (rows.length === 0) {
      throw new Error(`${book.file}: hadith table is empty`);
    }

    bookRows.push({
      uci: `HZ${book.number}`,
      number: book.number,
      hadithPrefix: book.prefix,
      slug: book.slug,
      nameArabic: book.nameArabic,
      nameUrdu: book.nameUrdu,
    });

    // Group rows into kitabs and baabs in first-appearance (reading) order.
    const kitabBysourceId = new Map<
      string,
      { uci: string; baabs: Map<string, string> }
    >();

    for (const row of rows) {
      const kitabKey = clean(String(row.KitabID ?? '')) ?? '0';
      let kitab = kitabBysourceId.get(kitabKey);
      if (!kitab) {
        kitabCounter += 1;
        kitab = { uci: `HK${kitabCounter}`, baabs: new Map() };
        kitabBysourceId.set(kitabKey, kitab);
        kitabRows.push({
          uci: kitab.uci,
          number: kitabCounter,
          bookUci: `HZ${book.number}`,
          sourceId: kitabKey,
          numberInBook: kitabBysourceId.size,
          nameArabic: clean(row.KitaabNameArabic),
          nameUrdu: clean(row.KitaabNameUrdu),
        });
      }

      // BaabHiddenID distinguishes sub-baabs ('57.1'); abu-dawood, ibn-e-maja
      // and buloogh-al-maram leave it empty, so fall back to BaabID. One
      // buloogh preface row has neither and lands on '0'.
      const baabKey =
        clean(row.BaabHiddenID) ?? clean(String(row.BaabID ?? '')) ?? '0';
      let baabUci = kitab.baabs.get(baabKey);
      if (!baabUci) {
        baabCounter += 1;
        baabUci = `HY${baabCounter}`;
        kitab.baabs.set(baabKey, baabUci);
        baabRows.push({
          uci: baabUci,
          number: baabCounter,
          kitabUci: kitab.uci,
          sourceId: baabKey,
          numberInKitab: kitab.baabs.size,
          nameArabic: clean(row.BaabNameArabic),
          nameUrdu: clean(row.BaabNameUrdu),
        });
      }

      const { number, subNumber, suffix } = parseHadithNumber(
        row.HadeesNumber,
      );
      const hadithUci = `${book.prefix}${number}${suffix}`;
      hadithRows.push({
        uci: hadithUci,
        bookPrefix: book.prefix,
        kitabUci: kitab.uci,
        baabUci,
        number,
        subNumber,
        grade: clean(row.HadithHukamAjmali),
        takhreej: clean(row.HadithTakhreej),
      });

      const arabic = clean(row.HadithArabicText);
      if (arabic) {
        textRows.push({
          uci: textUci(1, book.number, number, suffix),
          hadithUci,
          editionUci: 'HE1',
          text: arabic,
          textPlain: clean(row.HadithArabicTextSearch) ?? arabic,
        });
      }
      const urdu = clean(row.HadithUrduText);
      if (urdu) {
        textRows.push({
          uci: textUci(2, book.number, number, suffix),
          hadithUci,
          editionUci: 'HE2',
          text: urdu,
          textPlain: clean(row.temp1 ?? row.temp) ?? urdu,
          footnote: clean(row.HadithHashiaText),
        });
      }
    }

    console.log(`read ${book.slug}: ${rows.length} hadiths`);
  }

  console.log(
    `inserting: ${bookRows.length} books, ${kitabRows.length} kitabs, ` +
      `${baabRows.length} baabs, ${hadithRows.length} hadiths, ` +
      `${textRows.length} texts`,
  );

  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`TRUNCATE hadith_texts, hadiths, baabs, kitabs, editions, books`,
    );
    await tx.insert(books).values(bookRows);
    await tx.insert(editions).values(
      EDITIONS.map((e) => ({
        uci: `HE${e.number}`,
        number: e.number,
        slug: e.slug,
        name: e.name,
        language: e.language,
        type: e.type,
      })),
    );
    await insertChunked((chunk) => tx.insert(kitabs).values(chunk), kitabRows);
    await insertChunked((chunk) => tx.insert(baabs).values(chunk), baabRows);
    await insertChunked(
      (chunk) => tx.insert(hadiths).values(chunk),
      hadithRows,
    );
    await insertChunked(
      (chunk) => tx.insert(hadithTexts).values(chunk),
      textRows,
    );
  });

  await verify(db);
  await pool.end();
}

/** Re-verify what the CHECK constraints can't express, Quran-project style. */
async function verify(db: ReturnType<typeof drizzle>): Promise<void> {
  const badComposites = await db.execute(sql`
    SELECT t.uci
    FROM hadith_texts t
    JOIN hadiths h ON h.uci = t.hadith_uci
    JOIN books b ON b.hadith_prefix = h.book_prefix
    JOIN editions e ON e.uci = t.edition_uci
    WHERE t.uci <> 'HX' || e.number || lpad(b.number::text, 2, '0')
                        || lpad(h.number::text, 5, '0')
                        || CASE WHEN h.sub_number = 0 THEN ''
                                ELSE chr(64 + h.sub_number) END
    LIMIT 5
  `);
  if (badComposites.rows.length > 0) {
    throw new Error(
      `HX composite mismatch, e.g. ${JSON.stringify(badComposites.rows)}`,
    );
  }

  const orphanKitabs = await db.execute(sql`
    SELECT h.uci FROM hadiths h
    JOIN baabs bb ON bb.uci = h.baab_uci
    WHERE bb.kitab_uci <> h.kitab_uci
    LIMIT 5
  `);
  if (orphanKitabs.rows.length > 0) {
    throw new Error(
      `hadith baab/kitab mismatch, e.g. ${JSON.stringify(orphanKitabs.rows)}`,
    );
  }

  const counts = await db.execute(sql`
    SELECT (SELECT count(*) FROM books) AS books,
           (SELECT count(*) FROM kitabs) AS kitabs,
           (SELECT count(*) FROM baabs) AS baabs,
           (SELECT count(*) FROM hadiths) AS hadiths,
           (SELECT count(*) FROM editions) AS editions,
           (SELECT count(*) FROM hadith_texts) AS hadith_texts
  `);
  console.log('seeded:', counts.rows[0]);
}

main().catch((error) => {
  const cause = error?.cause ?? error;
  console.error(cause?.message ?? cause);
  if (cause?.detail) console.error('detail:', cause.detail);
  if (cause?.constraint) console.error('constraint:', cause.constraint);
  process.exit(1);
});
