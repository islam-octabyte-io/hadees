import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { listQuerySchema } from '../../common/dto/list-query.dto';

export const baabQuerySchema = listQuerySchema.extend({
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
});

export class BaabQueryDto extends createZodDto(baabQuerySchema) {}
