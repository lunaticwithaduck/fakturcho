import type {
  CheckoutSessionDto,
  CreditBalanceDto,
  CreditLedgerEntryDto,
  SubscriptionDto,
} from '@fakturcho/shared-types';
import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import { parseOrThrow } from '../documents/zod-parse.util';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { checkoutRequestSchema } from './dto-schemas';
import { PaddleService } from './paddle.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly creditsService: CreditsService,
    private readonly paddleService: PaddleService,
  ) {}

  @Get('subscription')
  getSubscription(@AccountId() accountId: string): Promise<SubscriptionDto | null> {
    return this.billingService.getSubscription(accountId);
  }

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
  ): Promise<CheckoutSessionDto> {
    const request = parseOrThrow(checkoutRequestSchema, body);
    return this.billingService.createCheckout(accountId, request.product);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('paddle-signature') signature: string | undefined,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new DomainError('UNAUTHORIZED', 'Missing Paddle signature');
    }
    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
    const event = await this.paddleService.parseWebhook(rawBody, signature);
    await this.billingService.handleWebhookEvent(event);
    return { received: true };
  }
}
