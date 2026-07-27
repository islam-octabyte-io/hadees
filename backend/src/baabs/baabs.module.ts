import { Module } from '@nestjs/common';
import { HadithsModule } from '../hadiths/hadiths.module';
import { BaabsController } from './baabs.controller';
import { BaabsService } from './baabs.service';

@Module({
  imports: [HadithsModule],
  controllers: [BaabsController],
  providers: [BaabsService],
  exports: [BaabsService], // KitabsService backs GET /kitabs/:id/baabs with it
})
export class BaabsModule {}
