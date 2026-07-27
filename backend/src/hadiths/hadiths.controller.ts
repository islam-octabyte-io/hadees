import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EditionQueryDto } from '../common/dto/edition-query.dto';
import { HadithQueryDto } from './dto/hadith-query.dto';
import { HadithDto, PaginatedHadithsDto } from './dto/hadith.response';
import { HadithsService } from './hadiths.service';

@ApiTags('hadiths')
@Controller('hadiths')
export class HadithsController {
  constructor(private readonly hadithsService: HadithsService) {}

  @Get()
  @ApiOperation({
    summary: 'List hadiths, optionally filtered by book, kitab and/or baab',
  })
  @ApiOkResponse({ type: PaginatedHadithsDto })
  findAll(@Query() query: HadithQueryDto) {
    return this.hadithsService.findAll(query);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get one hadith with its texts' })
  @ApiParam({
    name: 'identifier',
    description:
      'UCI (HB100) or "<book>:<number>" (bukhari:100). Variant narrations use the dotted source number, e.g. aladab-almufarrad:270.1 (= HA270A).',
    example: 'HB100',
  })
  @ApiOkResponse({ type: HadithDto })
  findOne(
    @Param('identifier') identifier: string,
    @Query() query: EditionQueryDto,
  ) {
    return this.hadithsService.findOne(identifier, query.edition);
  }
}
