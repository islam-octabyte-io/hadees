import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { BaabsModule } from './baabs/baabs.module';
import { BooksModule } from './books/books.module';
import { DbModule } from './db/db.module';
import { EditionsModule } from './editions/editions.module';
import { HadithsModule } from './hadiths/hadiths.module';
import { HealthModule } from './health/health.module';
import { KitabsModule } from './kitabs/kitabs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    // Books -> Kitabs -> Baabs -> Hadiths -> Editions. Parent identifiers are
    // resolved by the plain functions in `common/resolve.ts` rather than by the
    // parent's service, which is what keeps this chain acyclic.
    BooksModule,
    KitabsModule,
    BaabsModule,
    HadithsModule,
    EditionsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
