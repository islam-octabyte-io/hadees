import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createHadithSchema = z.object({
  collection: z
    .string()
    .min(1)
    .max(100)
    .describe('Collection slug, e.g. "bukhari"'),
  hadithNumber: z
    .int()
    .positive()
    .describe('Hadith number within the collection'),
  text: z.string().min(1).describe('Full hadith text'),
});

export class CreateHadithDto extends createZodDto(createHadithSchema) {}
