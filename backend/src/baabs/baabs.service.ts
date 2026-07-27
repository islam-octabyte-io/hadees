import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { paginate, type Paginated } from '../common/pagination';
import { resolveBaab, resolveBook, resolveKitab } from '../common/resolve';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import { baabs, kitabs, type Baab } from '../db/schema';
import type { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import type { HadithView } from '../hadiths/dto/hadith.response';
import { HadithsService } from '../hadiths/hadiths.service';
import { BaabQueryDto } from './dto/baab-query.dto';

@Injectable()
export class BaabsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly hadithsService: HadithsService,
  ) {}

  async findAll(query: BaabQueryDto): Promise<Paginated<Baab>> {
    const { page, limit } = query;

    const [book, kitab] = await Promise.all([
      query.book ? resolveBook(this.db, query.book) : undefined,
      query.kitab ? resolveKitab(this.db, query.kitab) : undefined,
    ]);

    const conditions = [
      kitab ? eq(baabs.kitabUci, kitab.uci) : undefined,
      book ? eq(kitabs.bookUci, book.uci) : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length ? and(...conditions) : undefined;

    // Joined unconditionally so the `?book=` filter and the count agree.
    const [totals] = await this.db
      .select({ value: count() })
      .from(baabs)
      .innerJoin(kitabs, eq(kitabs.uci, baabs.kitabUci))
      .where(where);

    const rows = await this.db
      .select({ baab: baabs })
      .from(baabs)
      .innerJoin(kitabs, eq(kitabs.uci, baabs.kitabUci))
      .where(where)
      .orderBy(baabs.number)
      .limit(limit)
      .offset((page - 1) * limit);

    return paginate(
      rows.map((r) => r.baab),
      totals?.value ?? 0,
      page,
      limit,
    );
  }

  findOne(identifier: string): Promise<Baab> {
    return resolveBaab(this.db, identifier);
  }

  /** Backs `GET /kitabs/:identifier/baabs`. */
  findByKitab(kitabUci: string): Promise<Baab[]> {
    return this.db
      .select()
      .from(baabs)
      .where(eq(baabs.kitabUci, kitabUci))
      .orderBy(baabs.numberInKitab);
  }

  async findHadiths(
    identifier: string,
    query: HadithListQueryDto,
  ): Promise<Paginated<HadithView>> {
    const baab = await this.findOne(identifier);
    return this.hadithsService.list({ baabUci: baab.uci }, query);
  }
}
