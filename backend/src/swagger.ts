import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * Mount Swagger UI at `/docs` and the raw OpenAPI document at `/docs-json`
 * (the latter is registered by `SwaggerModule.setup` for free).
 *
 * Kept out of `main.ts` so the e2e suite can mount the same document on its
 * test app and assert the route surface.
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Hadees API')
    .setDescription(
      [
        'Read API over the hadith corpus: 15 books, each split into kitabs and baabs.',
        '',
        'Entities are addressed by UCI (`HB100`), by number, by slug, or by a',
        'composite `<parent>:<number>` reference (`bukhari:100`, `bukhari:3:5`).',
        'Text-bearing routes take `?edition=` — a comma-separated list of edition',
        'slugs, defaulting to `ar-vocalized`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addTag('books')
    .addTag('kitabs')
    .addTag('baabs')
    .addTag('hadiths')
    .addTag('editions')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));
}
