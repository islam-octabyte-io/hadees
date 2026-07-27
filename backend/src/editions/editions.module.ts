import { Module } from '@nestjs/common';
import { EditionsController } from './editions.controller';
import { EditionsService } from './editions.service';

@Module({
  controllers: [EditionsController],
  providers: [EditionsService],
  exports: [EditionsService], // HadithsService resolves ?edition= through it
})
export class EditionsModule {}
