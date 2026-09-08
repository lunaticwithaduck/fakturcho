import type { MrrSummary, SubscriptionSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { parseOrThrow } from '../documents/zod-parse.util';
import { AdminGuard } from './admin.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { subscriptionListQuerySchema } from './dto-schemas';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminSubscriptions)
export class AdminSubscriptionsController {
  constructor(private readonly service: AdminSubscriptionsService) {}

  @Get()
  list(@Query() query: unknown): Promise<SubscriptionSummary[]> {
    const parsed = parseOrThrow(subscriptionListQuerySchema, query);
    return this.service.list(parsed.status ?? 'all');
  }

  @Get('summary')
  summary(): Promise<MrrSummary> {
    return this.service.summary();
  }
}
