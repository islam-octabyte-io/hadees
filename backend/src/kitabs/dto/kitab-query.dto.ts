import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { listQuerySchema } from '../../common/dto/list-query.dto';

export const kitabQuerySchema = listQuerySchema.extend({
  book: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .describe('Book slug, number, UCI or prefix, e.g. "bukhari"'),
});

export class KitabQueryDto extends createZodDto(kitabQuerySchema) {}
