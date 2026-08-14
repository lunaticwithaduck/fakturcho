import { Injectable, Logger } from '@nestjs/common';
import type { EventEntity } from '@paddle/paddle-node-sdk';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { DomainError } from '../common/domain-error';
import { inspectPaddleConfig, type PaddleConfigReport } from './paddle-config';
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
  private readonly config: PaddleConfigReport;

  constructor() {
    const apiKey = process.env.PADDLE_API_KEY ?? '';
    this.webhookSecret = process.env.PADDLE_WEBHOOK_SECRET ?? '';
    this.config = inspectPaddleConfig({
      environment: process.env.PADDLE_ENVIRONMENT,
      apiKey,
      webhookSecret: this.webhookSecret,
    });
    for (const problem of this.config.blocking) this.logger.error(problem);
    for (const problem of this.config.warnings) this.logger.warn(problem);
    this.logger.log(`Paddle client running against ${this.config.environment}`);

    this.client = new Paddle(apiKey, {
      environment:
        this.config.environment === 'production' ? Environment.production : Environment.sandbox,
    });
  }

  async createCheckoutTransaction(input: CreateCheckoutInput): Promise<string> {
    const [blocker] = this.config.blocking;
    if (blocker !== undefined) {
      throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
        provider: ['paddle_credentials_mismatch', `environment ${this.config.environment}`],
      });
    }

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
