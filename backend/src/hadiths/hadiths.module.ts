import { Module } from '@nestjs/common';
import { HadithsController } from './hadiths.controller';
import { HadithsService } from './hadiths.service';

@Module({
  controllers: [HadithsController],
  providers: [HadithsService],
})
export class HadithsModule {}
