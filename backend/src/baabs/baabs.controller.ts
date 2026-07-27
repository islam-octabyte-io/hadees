import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import { PaginatedHadithsDto } from '../hadiths/dto/hadith.response';
import { BaabsService } from './baabs.service';
import { BaabQueryDto } from './dto/baab-query.dto';
import { BaabDto, PaginatedBaabsDto } from './dto/baab.response';

const IDENTIFIER = {
  name: 'identifier',
  description:
    'Global number (1), UCI (HY1) or "<kitab>:<numberInKitab>" (HK3:5, bukhari:3:5)',
  example: 'HY1',
};

@ApiTags('baabs')
@Controller('baabs')
export class BaabsController {
  constructor(private readonly baabsService: BaabsService) {}

  @Get()
  @ApiOperation({ summary: 'List baabs, optionally filtered by book or kitab' })
  @ApiOkResponse({ type: PaginatedBaabsDto })
  findAll(@Query() query: BaabQueryDto) {
    return this.baabsService.findAll(query);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get one baab' })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: BaabDto })
  findOne(@Param('identifier') identifier: string) {
    return this.baabsService.findOne(identifier);
  }

  @Get(':identifier/hadiths')
  @ApiOperation({
    summary: 'List the hadiths of a baab, with per-edition text',
  })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: PaginatedHadithsDto })
  findHadiths(
    @Param('identifier') identifier: string,
    @Query() query: HadithListQueryDto,
  ) {
    return this.baabsService.findHadiths(identifier, query);
  }
}
