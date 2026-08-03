import type { SeriesInfoDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get } from '@nestjs/common';
import { AccountId } from '../common/account-id.decorator';
import { NumberingService } from './numbering.service';

@Controller(API_ROUTES.series)
export class NumberingController {
  constructor(private readonly numberingService: NumberingService) {}

  @Get()
  list(@AccountId() accountId: string): Promise<SeriesInfoDto[]> {
    return this.numberingService.getSeriesInfo(accountId);
  }
}
