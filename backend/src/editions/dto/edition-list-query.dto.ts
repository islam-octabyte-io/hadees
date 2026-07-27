import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const editionListQuerySchema = z.object({
  language: z
    .string()
    .min(1)
    .max(20)
    .optional()
    .describe('Filter by language code, e.g. "ur"'),
  type: z
    .enum(['original', 'translation', 'transliteration'])
    .optional()
    .describe('Filter by edition type'),
});

export class EditionListQueryDto extends createZodDto(editionListQuerySchema) {}
