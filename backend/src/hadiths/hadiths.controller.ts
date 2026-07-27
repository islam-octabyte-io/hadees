import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HadithQueryDto } from './dto/hadith-query.dto';
import { HadithsService } from './hadiths.service';

@ApiTags('hadiths')
@Controller('hadiths')
export class HadithsController {
  constructor(private readonly hadithsService: HadithsService) {}

  @Get()
  @ApiOperation({ summary: 'List hadiths, optionally filtered by book slug' })
  findAll(@Query() query: HadithQueryDto) {
    return this.hadithsService.findAll(query);
  }

  @Get(':uci')
  @ApiOperation({ summary: 'Get a hadith with its texts by UCI, e.g. HB100' })
  findOne(@Param('uci') uci: string) {
    return this.hadithsService.findOne(uci);
  }
}
