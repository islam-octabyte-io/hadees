import { Module } from '@nestjs/common';
import { EditionsModule } from '../editions/editions.module';
import { HadithsController } from './hadiths.controller';
import { HadithsService } from './hadiths.service';

@Module({
  imports: [EditionsModule],
  controllers: [HadithsController],
  providers: [HadithsService],
  // Books, kitabs and baabs delegate their `.../hadiths` routes here.
  exports: [HadithsService],
})
export class HadithsModule {}
