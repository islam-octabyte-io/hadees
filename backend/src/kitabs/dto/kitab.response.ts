import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginatedDto } from '../../common/pagination';

export const kitabSchema = z.object({
  uci: z.string().describe('e.g. "HK3"'),
  number: z.number().int().describe('Global sequence, in reading order'),
  bookUci: z.string(),
  sourceId: z.string().describe("The source database's KitabID"),
  numberInBook: z.number().int(),
  nameArabic: z.string().nullable(),
  nameUrdu: z.string().nullable(),
});

export class KitabDto extends createZodDto(kitabSchema) {}

export const PaginatedKitabsDto = paginatedDto(kitabSchema, 'PaginatedKitabs');
