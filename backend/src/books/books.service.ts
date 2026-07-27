import { Inject, Injectable } from '@nestjs/common';
import { type Paginated } from '../common/pagination';
import { resolveBook } from '../common/resolve';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import { books, type Book, type Kitab } from '../db/schema';
import type { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import type { HadithView } from '../hadiths/dto/hadith.response';
import { HadithsService } from '../hadiths/hadiths.service';
import { KitabsService } from '../kitabs/kitabs.service';

@Injectable()
export class BooksService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDb,
    private readonly kitabsService: KitabsService,
    private readonly hadithsService: HadithsService,
  ) {}

  /** All 15 books — a fixed, tiny set, so this is deliberately unpaginated. */
  findAll(): Promise<Book[]> {
    return this.db.select().from(books).orderBy(books.number);
  }

  findOne(identifier: string): Promise<Book> {
    return resolveBook(this.db, identifier);
  }

  async findKitabs(identifier: string): Promise<Kitab[]> {
    const book = await this.findOne(identifier);
    return this.kitabsService.findByBook(book.uci);
  }

  async findHadiths(
    identifier: string,
    query: HadithListQueryDto,
  ): Promise<Paginated<HadithView>> {
    const book = await this.findOne(identifier);
    return this.hadithsService.list({ bookPrefix: book.hadithPrefix }, query);
  }
}
