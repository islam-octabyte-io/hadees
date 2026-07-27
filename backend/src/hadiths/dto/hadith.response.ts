import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginatedDto } from '../../common/pagination';

export const hadithTextSchema = z.object({
  uci: z.string().describe('Composite text UCI, e.g. "HX10100100"'),
  editionUci: z.string(),
  edition: z.string().describe('Edition slug, e.g. "ar-vocalized"'),
  text: z.string(),
  footnote: z.string().nullable(),
});

export const hadithSchema = z.object({
  uci: z.string().describe('e.g. "HB100"; variants end in a letter, "HA270A"'),
  bookPrefix: z.string(),
  kitabUci: z.string(),
  baabUci: z.string(),
  number: z.number().int().describe('Hadith number within its own book'),
  subNumber: z
    .number()
    .int()
    .describe('0 for regular hadiths, 1+ for variants'),
  grade: z.string().nullable(),
  takhreej: z.string().nullable(),
  texts: z
    .array(hadithTextSchema)
    .describe('One entry per requested edition; may be empty if untranslated'),
});

export type HadithView = z.infer<typeof hadithSchema>;

export class HadithDto extends createZodDto(hadithSchema) {}

export const PaginatedHadithsDto = paginatedDto(
  hadithSchema,
  'PaginatedHadiths',
);
