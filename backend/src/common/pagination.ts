import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number().int().describe('1-based page number that was returned'),
  limit: z.number().int().describe('Maximum items per page'),
  total: z.number().int().describe('Total matching rows, ignoring pagination'),
  totalPages: z.number().int(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Build a `{ data, meta }` response DTO around an item schema, so the envelope
 * shows up in `/docs-json` with a real payload type rather than `object`.
 *
 * The generated class is renamed because nestjs-zod derives the OpenAPI schema
 * name from `class.name`; without this every envelope would collide on `Dto`.
 */
export function paginatedDto<T extends z.ZodType>(item: T, name: string) {
  class Dto extends createZodDto(
    z.object({ data: z.array(item), meta: paginationMetaSchema }),
  ) {}
  Object.defineProperty(Dto, 'name', { value: name });
  return Dto;
}
