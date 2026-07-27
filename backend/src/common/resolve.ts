import { NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../db/db.module';
import {
  baabs,
  books,
  kitabs,
  type Baab,
  type Book,
  type Kitab,
} from '../db/schema';

/**
 * Public identifier parsing for the `H` corpus.
 *
 * Every entity accepts several spellings of "which one" — a UCI, a global
 * number, a slug — plus a *composite* form addressing a child by its position
 * inside its parent (`bukhari:3` = kitab 3 of Bukhari).
 *
 * Composite identifiers follow one rule: **split on the LAST colon** — the left
 * side resolves as the parent, the right side is the number within it. Slugs
 * and UCIs never contain a colon, so this composes to any depth:
 * `bukhari:3:5` is baab 5 of kitab 3 of Bukhari.
 */

const NUMERIC = /^\d+$/;
const BOOK_UCI = /^HZ\d+$/i;
const KITAB_UCI = /^HK\d+$/i;
const BAAB_UCI = /^HY\d+$/i;
const EDITION_UCI = /^HE\d+$/i;
const HADITH_PREFIX = /^H[A-Z]$/i;
const HADITH_UCI = /^H[A-Z]\d+[A-Z]?$/i;

/**
 * Second letters owned by structural entities (see the UCI registry in
 * `db/schema/books.ts`). No book's `hadith_prefix` uses one, so they let
 * `HZ1` (a book) be told apart from `HB1` (a hadith).
 */
const STRUCTURAL_LETTERS = new Set(['Z', 'K', 'Y', 'E', 'X']);

export function splitLastColon(
  id: string,
): { parent: string; child: string } | null {
  const i = id.lastIndexOf(':');
  if (i <= 0 || i === id.length - 1) return null;
  return { parent: id.slice(0, i), child: id.slice(i + 1) };
}

export function isEditionUci(id: string): boolean {
  return EDITION_UCI.test(id);
}

export type HadithRef =
  | { kind: 'uci'; uci: string }
  | { kind: 'composite'; bookRef: string; number: number; subNumber: number };

/**
 * Parse a hadith identifier without touching the database.
 *
 * `HB100` → the UCI directly. `bukhari:100` → book ref plus number. Variant
 * narrations carry the source's dotted number (`aladab-almufarrad:270.1`),
 * which becomes `subNumber` 1 and, via {@link buildHadithUci}, the UCI suffix
 * `A` required by the `hadiths_uci_check` constraint.
 */
export function parseHadithRef(id: string): HadithRef | null {
  const parts = splitLastColon(id);
  if (parts) {
    const m = /^(\d+)(?:\.(\d+))?$/.exec(parts.child);
    if (!m) return null;
    const subNumber = m[2] ? Number(m[2]) : 0;
    if (subNumber > 26) return null; // no letter left to encode it
    return {
      kind: 'composite',
      bookRef: parts.parent,
      number: Number(m[1]),
      subNumber,
    };
  }
  const uci = id.toUpperCase();
  if (HADITH_UCI.test(uci) && !STRUCTURAL_LETTERS.has(uci[1])) {
    return { kind: 'uci', uci };
  }
  return null;
}

/** `('HA', 270, 1)` → `'HA270A'`; sub-number 0 yields a plain numeric UCI. */
export function buildHadithUci(
  prefix: string,
  number: number,
  subNumber: number,
): string {
  const variant = subNumber > 0 ? String.fromCharCode(64 + subNumber) : '';
  return `${prefix}${number}${variant}`;
}

/** Accepts a book number (`1`), slug (`bukhari`), UCI (`HZ1`) or prefix (`HB`). */
export async function resolveBook(db: DrizzleDb, id: string): Promise<Book> {
  const where = NUMERIC.test(id)
    ? eq(books.number, Number(id))
    : BOOK_UCI.test(id)
      ? eq(books.uci, id.toUpperCase())
      : HADITH_PREFIX.test(id)
        ? eq(books.hadithPrefix, id.toUpperCase())
        : eq(books.slug, id.toLowerCase());

  const [found] = await db.select().from(books).where(where);
  if (!found) throw new NotFoundException(`Book "${id}" not found`);
  return found;
}

/** Accepts a global number (`3`), UCI (`HK3`) or `<bookRef>:<numberInBook>`. */
export async function resolveKitab(db: DrizzleDb, id: string): Promise<Kitab> {
  const parts = splitLastColon(id);
  if (parts) {
    if (!NUMERIC.test(parts.child)) {
      throw new NotFoundException(`Kitab "${id}" not found`);
    }
    const book = await resolveBook(db, parts.parent);
    const [found] = await db
      .select()
      .from(kitabs)
      .where(
        and(
          eq(kitabs.bookUci, book.uci),
          eq(kitabs.numberInBook, Number(parts.child)),
        ),
      );
    if (!found) throw new NotFoundException(`Kitab "${id}" not found`);
    return found;
  }

  const where = KITAB_UCI.test(id)
    ? eq(kitabs.uci, id.toUpperCase())
    : NUMERIC.test(id)
      ? eq(kitabs.number, Number(id))
      : null;
  if (!where) throw new NotFoundException(`Kitab "${id}" not found`);

  const [found] = await db.select().from(kitabs).where(where);
  if (!found) throw new NotFoundException(`Kitab "${id}" not found`);
  return found;
}

/** Accepts a global number (`1`), UCI (`HY1`) or `<kitabRef>:<numberInKitab>`. */
export async function resolveBaab(db: DrizzleDb, id: string): Promise<Baab> {
  const parts = splitLastColon(id);
  if (parts) {
    if (!NUMERIC.test(parts.child)) {
      throw new NotFoundException(`Baab "${id}" not found`);
    }
    const kitab = await resolveKitab(db, parts.parent);
    const [found] = await db
      .select()
      .from(baabs)
      .where(
        and(
          eq(baabs.kitabUci, kitab.uci),
          eq(baabs.numberInKitab, Number(parts.child)),
        ),
      );
    if (!found) throw new NotFoundException(`Baab "${id}" not found`);
    return found;
  }

  const where = BAAB_UCI.test(id)
    ? eq(baabs.uci, id.toUpperCase())
    : NUMERIC.test(id)
      ? eq(baabs.number, Number(id))
      : null;
  if (!where) throw new NotFoundException(`Baab "${id}" not found`);

  const [found] = await db.select().from(baabs).where(where);
  if (!found) throw new NotFoundException(`Baab "${id}" not found`);
  return found;
}
