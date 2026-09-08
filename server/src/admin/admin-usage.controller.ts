import type { UsageMonthSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminUsageService } from './admin-usage.service';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminUsageMonths)
export class AdminUsageController {
  constructor(private readonly service: AdminUsageService) {}

  @Get()
  months(): Promise<UsageMonthSummary[]> {
    return this.service.months();
  }
}
