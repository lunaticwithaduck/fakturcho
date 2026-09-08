import type {
  CreditPurchaseRow,
  CreditSalesMonth,
  CreditSalesSummary,
} from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminCreditsService } from './admin-credits.service';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminCredits)
export class AdminCreditsController {
  constructor(private readonly service: AdminCreditsService) {}

  @Get('summary')
  summary(): Promise<CreditSalesSummary> {
    return this.service.summary();
  }

  @Get('months')
  months(): Promise<CreditSalesMonth[]> {
    return this.service.months();
  }

  @Get('purchases')
  purchases(): Promise<CreditPurchaseRow[]> {
    return this.service.purchases();
  }
}
