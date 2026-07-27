import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import { PaginatedHadithsDto } from '../hadiths/dto/hadith.response';
import { KitabDto } from '../kitabs/dto/kitab.response';
import { BooksService } from './books.service';
import { BookDto } from './dto/book.response';

const IDENTIFIER = {
  name: 'identifier',
  description: 'Number (1), slug (bukhari), UCI (HZ1) or hadith prefix (HB)',
  example: 'bukhari',
};

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List all 15 books, in canonical order' })
  @ApiOkResponse({ type: [BookDto] })
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get one book' })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: BookDto })
  findOne(@Param('identifier') identifier: string) {
    return this.booksService.findOne(identifier);
  }

  @Get(':identifier/kitabs')
  @ApiOperation({ summary: 'List the kitabs of a book, in reading order' })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: [KitabDto] })
  findKitabs(@Param('identifier') identifier: string) {
    return this.booksService.findKitabs(identifier);
  }

  @Get(':identifier/hadiths')
  @ApiOperation({
    summary: 'List the hadiths of a book, with per-edition text',
  })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: PaginatedHadithsDto })
  findHadiths(
    @Param('identifier') identifier: string,
    @Query() query: HadithListQueryDto,
  ) {
    return this.booksService.findHadiths(identifier, query);
  }
}
