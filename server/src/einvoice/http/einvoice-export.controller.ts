import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AccountId } from '../../common/account-id.decorator';
import { RequireFeatureFlag } from '../../feature-flags/feature-flag.decorator';
import { FeatureFlagGuard } from '../../feature-flags/feature-flag.guard';
import { EinvoiceExportService } from './einvoice-export.service';
import type { EinvoiceReadinessResult } from './einvoice-mapper-selection';

@Controller(API_ROUTES.documents)
export class EinvoiceExportController {
  constructor(private readonly einvoiceExportService: EinvoiceExportService) {}

  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlag('EINVOICE')
  @Get(':id/einvoice/readiness')
  readiness(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<EinvoiceReadinessResult> {
    return this.einvoiceExportService.getReadiness(accountId, id);
  }

  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlag('EINVOICE')
  @Get(':id/einvoice/xml')
  async xml(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const xml = await this.einvoiceExportService.getXml(accountId, id);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  }
}
