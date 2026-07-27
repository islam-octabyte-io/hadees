import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The edition returned when `?edition=` is omitted — the Arabic original. */
export const DEFAULT_EDITION = 'ar-vocalized';

export const editionParam = z
  .string()
  .min(1)
  .optional()
  .describe(
    `Comma-separated edition slugs, numbers or UCIs, e.g. "ar-vocalized,ur-darussalam". Defaults to "${DEFAULT_EDITION}".`,
  );

export const editionQuerySchema = z.object({ edition: editionParam });

export class EditionQueryDto extends createZodDto(editionQuerySchema) {}
