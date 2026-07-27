import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import {
  books,
  hadiths,
  hadithTexts,
  type Hadith,
  type HadithText,
} from '../db/schema';
import { HadithQueryDto } from './dto/hadith-query.dto';

@Injectable()
export class HadithsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(query: HadithQueryDto): Promise<Hadith[]> {
    const { book, page, limit } = query;
    const rows = await this.db
      .select({ hadith: hadiths })
      .from(hadiths)
      .innerJoin(books, eq(books.hadithPrefix, hadiths.bookPrefix))
      .where(book ? eq(books.slug, book) : undefined)
      .orderBy(hadiths.bookPrefix, hadiths.number)
      .limit(limit)
      .offset((page - 1) * limit);
    return rows.map((row) => row.hadith);
  }

  async findOne(uci: string): Promise<Hadith & { texts: HadithText[] }> {
    const [found] = await this.db
      .select()
      .from(hadiths)
      .where(eq(hadiths.uci, uci));
    if (!found) {
      throw new NotFoundException(`Hadith ${uci} not found`);
    }
    const texts = await this.db
      .select()
      .from(hadithTexts)
      .where(eq(hadithTexts.hadithUci, uci))
      .orderBy(hadithTexts.editionUci);
    return { ...found, texts };
  }
}
