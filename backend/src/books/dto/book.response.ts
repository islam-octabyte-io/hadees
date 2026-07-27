import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const bookSchema = z.object({
  uci: z.string().describe('e.g. "HZ1"'),
  number: z
    .number()
    .int()
    .describe('Canonical order; the six sahih come first'),
  hadithPrefix: z
    .string()
    .describe('UCI prefix of this book\'s hadiths, e.g. "HB"'),
  slug: z.string().describe('e.g. "bukhari"'),
  nameArabic: z.string(),
  nameUrdu: z.string(),
});

export class BookDto extends createZodDto(bookSchema) {}
