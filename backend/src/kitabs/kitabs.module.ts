import { Module } from '@nestjs/common';
import { BaabsModule } from '../baabs/baabs.module';
import { HadithsModule } from '../hadiths/hadiths.module';
import { KitabsController } from './kitabs.controller';
import { KitabsService } from './kitabs.service';

@Module({
  imports: [BaabsModule, HadithsModule],
  controllers: [KitabsController],
  providers: [KitabsService],
  exports: [KitabsService], // BooksService backs GET /books/:id/kitabs with it
})
export class KitabsModule {}
