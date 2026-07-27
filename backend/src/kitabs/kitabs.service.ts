import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { BaabsService } from '../baabs/baabs.service';
import { paginate, type Paginated } from '../common/pagination';
import { resolveBook, resolveKitab } from '../common/resolve';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import { kitabs, type Baab, type Kitab } from '../db/schema';
import type { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import type { HadithView } from '../hadiths/dto/hadith.response';
import { HadithsService } from '../hadiths/hadiths.service';
import { KitabQueryDto } from './dto/kitab-query.dto';

@Injectable()
export class KitabsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly baabsService: BaabsService,
    private readonly hadithsService: HadithsService,
  ) {}

  async findAll(query: KitabQueryDto): Promise<Paginated<Kitab>> {
    const { page, limit } = query;
    const book = query.book
      ? await resolveBook(this.db, query.book)
      : undefined;
    const where = book ? eq(kitabs.bookUci, book.uci) : undefined;

    const [totals] = await this.db
      .select({ value: count() })
      .from(kitabs)
      .where(where);

    // `number` is a global sequence assigned in reading order, so ordering by
    // it groups kitabs by book and keeps each book internally in order.
    const rows = await this.db
      .select()
      .from(kitabs)
      .where(where)
      .orderBy(kitabs.number)
      .limit(limit)
      .offset((page - 1) * limit);

    return paginate(rows, totals?.value ?? 0, page, limit);
  }

  findOne(identifier: string): Promise<Kitab> {
    return resolveKitab(this.db, identifier);
  }

  /** Backs `GET /books/:identifier/kitabs`. */
  findByBook(bookUci: string): Promise<Kitab[]> {
    return this.db
      .select()
      .from(kitabs)
      .where(eq(kitabs.bookUci, bookUci))
      .orderBy(kitabs.numberInBook);
  }

  async findBaabs(identifier: string): Promise<Baab[]> {
    const kitab = await this.findOne(identifier);
    return this.baabsService.findByKitab(kitab.uci);
  }

  async findHadiths(
    identifier: string,
    query: HadithListQueryDto,
  ): Promise<Paginated<HadithView>> {
    const kitab = await this.findOne(identifier);
    return this.hadithsService.list({ kitabUci: kitab.uci }, query);
  }
}
