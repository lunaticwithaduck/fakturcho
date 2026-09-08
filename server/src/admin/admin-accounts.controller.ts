import type { AccountDetail, AccountSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { parseOrThrow } from '../documents/zod-parse.util';
import { AdminGuard } from './admin.guard';
import { AdminAccountsService } from './admin-accounts.service';
import { accountListQuerySchema } from './dto-schemas';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminAccounts)
export class AdminAccountsController {
  constructor(private readonly service: AdminAccountsService) {}

  @Get()
  list(@Query() query: unknown): Promise<AccountSummary[]> {
    const parsed = parseOrThrow(accountListQuerySchema, query);
    return this.service.list({ search: parsed.search ?? '', status: parsed.status ?? 'all' });
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<AccountDetail> {
    return this.service.detail(id);
  }
}
