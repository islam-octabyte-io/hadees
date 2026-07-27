import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EditionListQueryDto } from './dto/edition-list-query.dto';
import { EditionDto } from './dto/edition.response';
import { EditionsService } from './editions.service';

@ApiTags('editions')
@Controller('editions')
export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  @Get()
  @ApiOperation({ summary: 'List editions, filtered by language and/or type' })
  @ApiOkResponse({ type: [EditionDto] })
  findAll(@Query() query: EditionListQueryDto) {
    return this.editionsService.findAll(query);
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get one edition' })
  @ApiParam({
    name: 'identifier',
    description: 'Slug (ur-darussalam), number (2) or UCI (HE2)',
    example: 'ur-darussalam',
  })
  @ApiOkResponse({ type: EditionDto })
  findOne(@Param('identifier') identifier: string) {
    return this.editionsService.findOne(identifier);
  }
}
