import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const editionSchema = z.object({
  uci: z.string().describe('e.g. "HE1"'),
  number: z.number().int(),
  slug: z.string().describe('e.g. "ar-vocalized"'),
  name: z.string(),
  language: z.string().describe('ISO 639-1, e.g. "ar", "ur"'),
  type: z.enum(['original', 'translation', 'transliteration']),
});

export class EditionDto extends createZodDto(editionSchema) {}
