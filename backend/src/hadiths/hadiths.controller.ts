import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateHadithDto } from './dto/create-hadith.dto';
import { HadithQueryDto } from './dto/hadith-query.dto';
import { HadithsService } from './hadiths.service';

@ApiTags('hadiths')
@Controller('hadiths')
export class HadithsController {
  constructor(private readonly hadithsService: HadithsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a hadith' })
  create(@Body() dto: CreateHadithDto) {
    return this.hadithsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List hadiths, optionally filtered by collection' })
  findAll(@Query() query: HadithQueryDto) {
    return this.hadithsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hadith by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hadithsService.findOne(id);
  }
}
