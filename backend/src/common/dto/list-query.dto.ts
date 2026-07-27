import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('1-based page'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(50)
    .describe('Items per page (max 100)'),
});

export class ListQueryDto extends createZodDto(listQuerySchema) {}
