import type { CheckoutSessionDto, SubscriptionDto } from '@fakturcho/shared-types';
import { Controller, Get, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import { BillingService } from './billing.service';
import { PaddleService } from './paddle.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly paddleService: PaddleService,
  ) {}

  @Get('subscription')
  getSubscription(@AccountId() accountId: string): Promise<SubscriptionDto> {
    return this.billingService.getSubscription(accountId);
  }

  @Post('checkout')
  createCheckout(@AccountId() accountId: string): Promise<CheckoutSessionDto> {
    return this.billingService.createCheckout(accountId);
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
