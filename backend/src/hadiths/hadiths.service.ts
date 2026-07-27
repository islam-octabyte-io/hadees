import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import { hadiths, type Hadith } from '../db/schema';
import { CreateHadithDto } from './dto/create-hadith.dto';
import { HadithQueryDto } from './dto/hadith-query.dto';

@Injectable()
export class HadithsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(dto: CreateHadithDto): Promise<Hadith> {
    const [created] = await this.db.insert(hadiths).values(dto).returning();
    return created;
  }

  async findAll(query: HadithQueryDto): Promise<Hadith[]> {
    const { collection, page, limit } = query;
    return this.db
      .select()
      .from(hadiths)
      .where(collection ? eq(hadiths.collection, collection) : undefined)
      .orderBy(hadiths.id)
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async findOne(id: number): Promise<Hadith> {
    const [found] = await this.db
      .select()
      .from(hadiths)
      .where(eq(hadiths.id, id));
    if (!found) {
      throw new NotFoundException(`Hadith with id ${id} not found`);
    }
    return found;
  }
}
