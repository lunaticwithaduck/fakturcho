import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { AccountId } from '../../common/account-id.decorator';
import { EinvoiceSendService } from './einvoice-send.service';
import type { EinvoiceTransmissionDto } from './einvoice-transmission.mapper';

@Controller(API_ROUTES.documents)
export class EinvoiceSendController {
  constructor(private readonly einvoiceSendService: EinvoiceSendService) {}

  @Post(':id/einvoice/send')
  send(@AccountId() accountId: string, @Param('id') id: string): Promise<EinvoiceTransmissionDto> {
    return this.einvoiceSendService.send(accountId, id);
  }

  @Get(':id/einvoice/transmission')
  getTransmission(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<EinvoiceTransmissionDto | null> {
    return this.einvoiceSendService.getTransmission(accountId, id);
  }
}
