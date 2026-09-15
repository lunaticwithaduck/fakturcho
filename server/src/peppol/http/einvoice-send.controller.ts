import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccountId } from '../../common/account-id.decorator';
import { RequireFeatureFlag } from '../../feature-flags/feature-flag.decorator';
import { FeatureFlagGuard } from '../../feature-flags/feature-flag.guard';
import { EinvoiceSendService } from './einvoice-send.service';
import type { EinvoiceTransmissionDto } from './einvoice-transmission.mapper';

@Controller(API_ROUTES.documents)
export class EinvoiceSendController {
  constructor(private readonly einvoiceSendService: EinvoiceSendService) {}

  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlag('PEPPOL')
  @Post(':id/einvoice/send')
  send(@AccountId() accountId: string, @Param('id') id: string): Promise<EinvoiceTransmissionDto> {
    return this.einvoiceSendService.send(accountId, id);
  }

  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlag('PEPPOL')
  @Post(':id/einvoice/refresh')
  refresh(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<EinvoiceTransmissionDto> {
    return this.einvoiceSendService.refresh(accountId, id);
  }

  @UseGuards(FeatureFlagGuard)
  @RequireFeatureFlag('PEPPOL')
  @Get(':id/einvoice/transmission')
  getTransmission(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<EinvoiceTransmissionDto | null> {
    return this.einvoiceSendService.getTransmission(accountId, id);
  }
}
