import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DEFAULT_EDITION } from '../common/dto/edition-query.dto';
import { isEditionUci } from '../common/resolve';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';
import { editions, type Edition } from '../db/schema';
import { EditionListQueryDto } from './dto/edition-list-query.dto';

@Injectable()
export class EditionsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  findAll(query: EditionListQueryDto): Promise<Edition[]> {
    const conditions = [
      query.language ? eq(editions.language, query.language) : undefined,
      query.type ? eq(editions.type, query.type) : undefined,
    ].filter((c) => c !== undefined);

    return this.db
      .select()
      .from(editions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(editions.number);
  }

  async findOne(identifier: string): Promise<Edition> {
    const found = this.match(await this.all(), identifier);
    if (!found)
      throw new NotFoundException(`Edition "${identifier}" not found`);
    return found;
  }

  /**
   * Resolve the `?edition=` query param — a comma-separated list of slugs,
   * numbers or UCIs — into edition rows, preserving the requested order.
   *
   * Unknown entries are a client error (400), not a missing resource: the
   * hadith being asked for exists, the edition name in the query does not.
   */
  async resolveMany(csv?: string): Promise<Edition[]> {
    const requested = (csv ?? DEFAULT_EDITION)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!requested.length) {
      throw new BadRequestException('Query param "edition" cannot be empty');
    }

    // The table holds a handful of rows; one read beats a query per entry.
    const all = await this.all();
    const resolved: Edition[] = [];
    for (const entry of requested) {
      const found = this.match(all, entry);
      if (!found) {
        throw new BadRequestException(
          `Unknown edition "${entry}". Known editions: ${all
            .map((e) => e.slug)
            .join(', ')}`,
        );
      }
      if (!resolved.some((e) => e.uci === found.uci)) resolved.push(found);
    }
    return resolved;
  }

  private all(): Promise<Edition[]> {
    return this.db.select().from(editions).orderBy(editions.number);
  }

  /** Match one identifier: UCI (`HE2`), number (`2`) or slug (`ur-darussalam`). */
  private match(all: Edition[], identifier: string): Edition | undefined {
    if (isEditionUci(identifier)) {
      const uci = identifier.toUpperCase();
      return all.find((e) => e.uci === uci);
    }
    if (/^\d+$/.test(identifier)) {
      return all.find((e) => e.number === Number(identifier));
    }
    const slug = identifier.toLowerCase();
    return all.find((e) => e.slug === slug);
  }
}
