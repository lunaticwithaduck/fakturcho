import type { TurnoverReportRow } from '@fakturcho/shared-types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { parseOrThrow } from '../documents/zod-parse.util';
import { AdminGuard } from './admin.guard';
import { AdminReportsService } from './admin-reports.service';
import { turnoverQuerySchema } from './dto-schemas';

@UseGuards(AdminGuard)
@Controller('api/admin/reports')
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  @Get('months')
  months(): string[] {
    return this.service.months();
  }

  @Get('turnover')
  turnover(@Query() query: unknown): Promise<TurnoverReportRow[]> {
    const parsed = parseOrThrow(turnoverQuerySchema, query);
    return this.service.turnover(parsed.month);
  }
}
