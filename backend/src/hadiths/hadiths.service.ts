import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import { paginate, type Paginated } from '../common/pagination';
import {
  buildHadithUci,
  parseHadithRef,
  resolveBaab,
  resolveBook,
  resolveKitab,
} from '../common/resolve';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import {
  books,
  hadiths,
  hadithTexts,
  type Edition,
  type Hadith,
} from '../db/schema';
import { EditionsService } from '../editions/editions.service';
import { HadithQueryDto } from './dto/hadith-query.dto';
import type { HadithView } from './dto/hadith.response';

/** Structural filter, already resolved to UCIs by the caller. */
export interface HadithFilter {
  bookPrefix?: string;
  kitabUci?: string;
  baabUci?: string;
}

export interface HadithListOptions {
  page: number;
  limit: number;
  edition?: string;
}

/**
 * The single owner of hadith reads. `/books/:id/hadiths`, `/kitabs/:id/hadiths`
 * and `/baabs/:id/hadiths` all resolve their own entity and then delegate to
 * {@link HadithsService.list}, so text loading and paging live in one place.
 */
@Injectable()
export class HadithsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly editionsService: EditionsService,
  ) {}

  /** `GET /hadiths` — resolves the string filters, then lists. */
  async findAll(query: HadithQueryDto): Promise<Paginated<HadithView>> {
    const [book, kitab, baab] = await Promise.all([
      query.book ? resolveBook(this.db, query.book) : undefined,
      query.kitab ? resolveKitab(this.db, query.kitab) : undefined,
      query.baab ? resolveBaab(this.db, query.baab) : undefined,
    ]);

    return this.list(
      {
        bookPrefix: book?.hadithPrefix,
        kitabUci: kitab?.uci,
        baabUci: baab?.uci,
      },
      query,
    );
  }

  async list(
    filter: HadithFilter,
    options: HadithListOptions,
  ): Promise<Paginated<HadithView>> {
    const { page, limit } = options;
    const editions = await this.editionsService.resolveMany(options.edition);

    const conditions = [
      filter.bookPrefix ? eq(hadiths.bookPrefix, filter.bookPrefix) : undefined,
      filter.kitabUci ? eq(hadiths.kitabUci, filter.kitabUci) : undefined,
      filter.baabUci ? eq(hadiths.baabUci, filter.baabUci) : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length ? and(...conditions) : undefined;

    const [totals] = await this.db
      .select({ value: count() })
      .from(hadiths)
      .where(where);
    const total = totals?.value ?? 0;

    // Joined to books so cross-book listings come out in canonical book order
    // rather than alphabetical prefix order (HA before HB before ... HZ).
    const rows = await this.db
      .select({ hadith: hadiths })
      .from(hadiths)
      .innerJoin(books, eq(books.hadithPrefix, hadiths.bookPrefix))
      .where(where)
      .orderBy(books.number, hadiths.number, hadiths.subNumber)
      .limit(limit)
      .offset((page - 1) * limit);

    const withTexts = await this.withTexts(
      rows.map((r) => r.hadith),
      editions,
    );
    return paginate(withTexts, total, page, limit);
  }

  /** `GET /hadiths/:identifier` — UCI (`HB100`) or composite (`bukhari:100`). */
  async findOne(identifier: string, edition?: string): Promise<HadithView> {
    const ref = parseHadithRef(identifier);
    if (!ref) throw new NotFoundException(`Hadith "${identifier}" not found`);

    let uci: string;
    if (ref.kind === 'uci') {
      uci = ref.uci;
    } else {
      const book = await resolveBook(this.db, ref.bookRef);
      uci = buildHadithUci(book.hadithPrefix, ref.number, ref.subNumber);
    }

    const [found] = await this.db
      .select()
      .from(hadiths)
      .where(eq(hadiths.uci, uci));
    if (!found) throw new NotFoundException(`Hadith "${identifier}" not found`);

    const editions = await this.editionsService.resolveMany(edition);
    const [view] = await this.withTexts([found], editions);
    return view;
  }

  /**
   * Attach per-edition texts to a page of hadiths in one extra query — the
   * alternative is a query per hadith, which at limit=100 is 100 round trips.
   * `text_plain` is deliberately not selected: it is the search-normalized
   * form, not display text.
   */
  private async withTexts(
    rows: Hadith[],
    editions: Edition[],
  ): Promise<HadithView[]> {
    if (!rows.length) return [];

    const slugByUci = new Map(editions.map((e) => [e.uci, e.slug]));
    const rankByUci = new Map(editions.map((e, i) => [e.uci, i]));

    const texts = await this.db
      .select({
        uci: hadithTexts.uci,
        hadithUci: hadithTexts.hadithUci,
        editionUci: hadithTexts.editionUci,
        text: hadithTexts.text,
        footnote: hadithTexts.footnote,
      })
      .from(hadithTexts)
      .where(
        and(
          inArray(
            hadithTexts.hadithUci,
            rows.map((r) => r.uci),
          ),
          inArray(
            hadithTexts.editionUci,
            editions.map((e) => e.uci),
          ),
        ),
      );

    const grouped = new Map<string, HadithView['texts']>();
    for (const t of texts) {
      const list = grouped.get(t.hadithUci) ?? [];
      list.push({
        uci: t.uci,
        editionUci: t.editionUci,
        edition: slugByUci.get(t.editionUci) ?? t.editionUci,
        text: t.text,
        footnote: t.footnote,
      });
      grouped.set(t.hadithUci, list);
    }

    // A few hadiths have no row in a given edition, so `texts` may be empty.
    return rows.map((hadith) => ({
      ...hadith,
      texts: (grouped.get(hadith.uci) ?? []).sort(
        (a, b) =>
          (rankByUci.get(a.editionUci) ?? 0) -
          (rankByUci.get(b.editionUci) ?? 0),
      ),
    }));
  }
}
