import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { editionParam } from '../../common/dto/edition-query.dto';
import { listQuerySchema } from '../../common/dto/list-query.dto';

/** `?edition=` plus `?page=`/`?limit=` — shared by every `.../hadiths` route. */
export const hadithListQuerySchema = listQuerySchema.extend({
  edition: editionParam,
});

export class HadithListQueryDto extends createZodDto(hadithListQuerySchema) {}

export const hadithQuerySchema = hadithListQuerySchema.extend({
  book: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Book slug, number, UCI or prefix, e.g. "bukhari"'),
  kitab: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Kitab number, UCI or "<book>:<n>", e.g. "HK3"'),
  baab: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Baab number, UCI or "<kitab>:<n>", e.g. "HY1"'),
});

export class HadithQueryDto extends createZodDto(hadithQuerySchema) {}
