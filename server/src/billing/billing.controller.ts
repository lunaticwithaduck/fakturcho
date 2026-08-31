import type {
  CreditBalanceDto,
  CreditLedgerEntryDto,
  WiseTransferInstructionsDto,
} from '@fakturcho/shared-types';
import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import { parseOrThrow } from '../documents/zod-parse.util';
import { CreditsService } from './credits.service';
import { checkoutRequestSchema } from './dto-schemas';
import { WiseService } from './wise.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly creditsService: CreditsService,
    private readonly wiseService: WiseService,
  ) {}

  @Get('credits')
  getCreditBalance(@AccountId() accountId: string): Promise<CreditBalanceDto> {
    return this.creditsService.getBalance(accountId);
  }

  @Get('credits/ledger')
  getCreditLedger(@AccountId() accountId: string): Promise<CreditLedgerEntryDto[]> {
    return this.creditsService.getLedger(accountId);
  }

  @Post('checkout')
  createCheckout(
    @AccountId() accountId: string,
    @Body() body: unknown,
  ): Promise<WiseTransferInstructionsDto> {
    const request = parseOrThrow(checkoutRequestSchema, body);
    return this.wiseService.createTransferInstructions(accountId, request.product);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-signature-sha256') signature: string | undefined,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new DomainError('UNAUTHORIZED', 'Missing Wise signature');
    }
    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
    if (!this.wiseService.verifyWebhookSignature(rawBody, signature)) {
      throw new DomainError('UNAUTHORIZED', 'Invalid Wise webhook signature');
    }
    await this.wiseService.handleBalanceUpdateWebhook(JSON.parse(rawBody));
    return { received: true };
  }
}
