import { Injectable } from '@nestjs/common';
import type { EventEntity } from '@paddle/paddle-node-sdk';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { DomainError } from '../common/domain-error';

export interface CreateCheckoutInput {
  priceId: string;
  accountId: string;
  paddleCustomerId?: string | null;
  creditCents?: number | null;
}

@Injectable()
export class PaddleService {
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
    const transaction = await this.client.transactions.create({
      items: [{ priceId: input.priceId, quantity: 1 }],
      ...(input.paddleCustomerId ? { customerId: input.paddleCustomerId } : {}),
      customData: {
        accountId: input.accountId,
        ...(typeof input.creditCents === 'number' ? { creditCents: input.creditCents } : {}),
      },
      checkout: {},
    });
    const url = transaction.checkout?.url;
    if (!url) {
      throw new Error('Paddle did not return a checkout URL');
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
