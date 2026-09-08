import type { TrafficOverview } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { parseOrThrow } from '../documents/zod-parse.util';
import { AdminGuard } from './admin.guard';
import { AdminTrafficService } from './admin-traffic.service';
import { trafficQuerySchema } from './dto-schemas';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminTraffic)
export class AdminTrafficController {
  constructor(private readonly service: AdminTrafficService) {}

  @Get()
  overview(@Query() query: unknown): Promise<TrafficOverview> {
    const parsed = parseOrThrow(trafficQuerySchema, query);
    return this.service.overview(parsed);
  }
}
