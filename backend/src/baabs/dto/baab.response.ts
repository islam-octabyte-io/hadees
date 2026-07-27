import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginatedDto } from '../../common/pagination';

export const baabSchema = z.object({
  uci: z.string().describe('e.g. "HY1"'),
  number: z.number().int().describe('Global sequence, in reading order'),
  kitabUci: z.string(),
  sourceId: z.string().describe("The source database's BaabHiddenID"),
  numberInKitab: z.number().int(),
  nameArabic: z.string().nullable(),
  nameUrdu: z.string().nullable(),
});

export class BaabDto extends createZodDto(baabSchema) {}

export const PaginatedBaabsDto = paginatedDto(baabSchema, 'PaginatedBaabs');
