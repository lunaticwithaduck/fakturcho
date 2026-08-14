import { Injectable, Logger } from '@nestjs/common';
import type { EventEntity } from '@paddle/paddle-node-sdk';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { DomainError } from '../common/domain-error';
import { describePaddleFailure, toDomainError } from './paddle-errors';

export interface CreateCheckoutInput {
  priceId: string;
  accountId: string;
  paddleCustomerId?: string | null;
  creditCents?: number | null;
}

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name);
  private readonly client: Paddle;
  private readonly webhookSecret: string;

  constructor() {
    const apiKey = process.env.PADDLE_API_KEY ?? '';
    const environment =
      process.env.PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox;
    this.client = new Paddle(apiKey, { environment });
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET ?? '';
  }

  async createCheckoutTransaction(input: CreateCheckoutInput): Promise<string> {
    let transaction: Awaited<ReturnType<typeof this.client.transactions.create>>;
    try {
      transaction = await this.client.transactions.create({
        items: [{ priceId: input.priceId, quantity: 1 }],
        ...(input.paddleCustomerId ? { customerId: input.paddleCustomerId } : {}),
        customData: {
          accountId: input.accountId,
          ...(typeof input.creditCents === 'number' ? { creditCents: input.creditCents } : {}),
        },
        checkout: {},
      });
    } catch (error) {
      const failure = describePaddleFailure(error);
      this.logger.error(
        `Paddle rejected checkout for price ${input.priceId}: ${failure.providerCode} — ${failure.providerDetail}`,
      );
      throw toDomainError(failure);
    }

    const url = transaction.checkout?.url;
    if (!url) {
      this.logger.error(
        `Paddle returned transaction ${transaction.id} without a checkout url — the seller account has no default payment link`,
      );
      throw new DomainError(
        'CHECKOUT_NOT_CONFIGURED',
        'The payment provider returned no checkout url. Set the default payment link on the seller account.',
        { provider: ['transaction_default_checkout_url_not_set', `transaction ${transaction.id}`] },
      );
    }
    return url;
  }

  async parseWebhook(rawBody: string, signature: string): Promise<EventEntity> {
    try {
      return await this.client.webhooks.unmarshal(rawBody, this.webhookSecret, signature);
    } catch {
      throw new DomainError('UNAUTHORIZED', 'Invalid Paddle webhook signature');
    }
  }
}
