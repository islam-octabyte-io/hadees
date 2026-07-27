import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BaabDto } from '../baabs/dto/baab.response';
import { HadithListQueryDto } from '../hadiths/dto/hadith-query.dto';
import { PaginatedHadithsDto } from '../hadiths/dto/hadith.response';
import { KitabQueryDto } from './dto/kitab-query.dto';
import { KitabDto, PaginatedKitabsDto } from './dto/kitab.response';
import { KitabsService } from './kitabs.service';

const IDENTIFIER = {
  name: 'identifier',
  description:
    'Global number (3), UCI (HK3) or "<book>:<numberInBook>" (bukhari:3)',
  example: 'HK3',
};

@ApiTags('kitabs')
@Controller('kitabs')
export class KitabsController {
  constructor(private readonly kitabsService: KitabsService) {}

  @Get()
  @ApiOperation({ summary: 'List kitabs, optionally filtered by book' })
  @ApiOkResponse({ type: PaginatedKitabsDto })
  findAll(@Query() query: KitabQueryDto) {
    return this.kitabsService.findAll(query);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get one kitab' })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: KitabDto })
  findOne(@Param('identifier') identifier: string) {
    return this.kitabsService.findOne(identifier);
  }

  @Get(':identifier/baabs')
  @ApiOperation({ summary: 'List the baabs of a kitab, in reading order' })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: [BaabDto] })
  findBaabs(@Param('identifier') identifier: string) {
    return this.kitabsService.findBaabs(identifier);
  }

  @Get(':identifier/hadiths')
  @ApiOperation({
    summary: 'List the hadiths of a kitab, with per-edition text',
  })
  @ApiParam(IDENTIFIER)
  @ApiOkResponse({ type: PaginatedHadithsDto })
  findHadiths(
    @Param('identifier') identifier: string,
    @Query() query: HadithListQueryDto,
  ) {
    return this.kitabsService.findHadiths(identifier, query);
  }
}
