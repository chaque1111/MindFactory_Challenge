import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobEntity } from './entities/jobs.entity';
import type { PaginatedRecordsResponse, UploadedCsvFile } from './records.service';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadCsv(@UploadedFile() file: UploadedCsvFile): Promise<JobEntity> {
    return this.recordsService.uploadCsv(file);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedRecordsResponse> {
    return this.recordsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<JobEntity> {
    return this.recordsService.findOne(id);
  }

  @Post(':id/process')
  process(@Param('id', new ParseUUIDPipe()) id: string): Promise<JobEntity> {
    return this.recordsService.processRecord(id);
  }
}
