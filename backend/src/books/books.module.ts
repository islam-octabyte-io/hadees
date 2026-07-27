import { Module } from '@nestjs/common';
import { HadithsModule } from '../hadiths/hadiths.module';
import { KitabsModule } from '../kitabs/kitabs.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [KitabsModule, HadithsModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
