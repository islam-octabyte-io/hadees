import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DRIZZLE, type DrizzleDb } from '../db/db.module';

export const healthSchema = z.object({
  status: z.literal('ok'),
  db: z.literal('up'),
  uptime: z.number().describe('Process uptime in seconds'),
});

export class HealthDto extends createZodDto(healthSchema) {}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  @Get()
  @ApiOperation({ summary: 'Service status and database connectivity' })
  @ApiOkResponse({ type: HealthDto })
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      // 503 rather than a 200 saying "down", so load balancers and uptime
      // checks see the failure without parsing the body.
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'down',
        uptime: process.uptime(),
      });
    }
    return { status: 'ok', db: 'up', uptime: process.uptime() };
  }
}
