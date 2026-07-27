import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const hadithQuerySchema = z.object({
  book: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Filter by book slug, e.g. "bukhari"'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export class HadithQueryDto extends createZodDto(hadithQuerySchema) {}
