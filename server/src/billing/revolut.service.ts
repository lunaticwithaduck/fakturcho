import { Injectable, Logger } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { inspectRevolutConfig, type RevolutConfigReport } from './revolut-config';
import { describeRevolutFailure, RevolutApiError, toDomainError } from './revolut-errors';
import type {
  CreateCustomerInput,
  CreateOrderInput,
  CreateSubscriptionInput,
  RevolutOrder,
  RevolutSubscription,
} from './revolut-types';
import {
  parseRevolutWebhookPayload,
  type RevolutWebhookPayload,
  verifyRevolutSignature,
} from './revolut-webhook';

const API_VERSION = '2024-09-01';

export type {
  CreateCustomerInput,
  CreateOrderInput,
  CreateSubscriptionInput,
  RevolutOrder,
  RevolutSubscription,
} from './revolut-types';

@Injectable()
export class RevolutService {
  private readonly logger = new Logger(RevolutService.name);
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly config: RevolutConfigReport;

  constructor() {
    this.apiKey = process.env.REVOLUT_API_KEY ?? '';
    this.webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET ?? '';
    this.config = inspectRevolutConfig({
      environment: process.env.REVOLUT_ENVIRONMENT,
      apiKey: this.apiKey,
      webhookSecret: this.webhookSecret,
    });
    for (const problem of this.config.blocking) this.logger.error(problem);
    for (const problem of this.config.warnings) this.logger.warn(problem);
    this.logger.log(`Revolut client running against ${this.config.environment}`);
  }

  async createCreditOrder(input: CreateOrderInput): Promise<{ id: string; checkoutUrl: string }> {
    const order = await this.request<{
      id: string;
      checkout_url?: string;
    }>('POST', '/orders', {
      amount: input.amountCents,
      currency: input.currency,
      merchant_order_data: { reference: input.extRef },
      metadata: input.metadata,
      ...(input.redirectUrl ? { redirect_url: input.redirectUrl } : {}),
    });
    return this.requireCheckoutUrl(order.id, order.checkout_url);
  }

  async getOrder(orderId: string): Promise<RevolutOrder> {
    const order = await this.request<{
      id: string;
      state: string;
      order_amount?: { value: number } | null;
      amount?: number;
      merchant_order_data: { reference: string | null } | null;
      metadata: Record<string, unknown> | null;
      checkout_url?: string;
      subscription_data?: { subscription_id: string } | null;
    }>('GET', `/orders/${orderId}`);
    return {
      id: order.id,
      state: order.state,
      amount: order.order_amount?.value ?? order.amount ?? 0,
      merchantOrderExtRef: order.merchant_order_data?.reference ?? null,
      metadata: order.metadata ?? {},
      checkoutUrl: order.checkout_url ?? null,
      subscriptionId: order.subscription_data?.subscription_id ?? null,
    };
  }

  async createCustomer(input: CreateCustomerInput): Promise<{ id: string }> {
    const customer = await this.request<{ id: string }>('POST', '/customers', {
      full_name: input.fullName,
      email: input.email,
    });
    return { id: customer.id };
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<RevolutSubscription> {
    const subscription = await this.request<{
      id: string;
      state: string;
      setup_order_id?: string;
      customer_id: string;
    }>('POST', '/subscriptions', {
      plan_variation_id: input.planVariationId,
      customer_id: input.customerId,
      external_reference: input.externalReference,
      setup_order_redirect_url: input.setupOrderRedirectUrl,
    });
    return {
      id: subscription.id,
      state: subscription.state,
      setupOrderId: subscription.setup_order_id ?? null,
      customerId: subscription.customer_id,
    };
  }

  async getSubscription(subscriptionId: string): Promise<RevolutSubscription> {
    const subscription = await this.request<{
      id: string;
      state: string;
      setup_order_id?: string;
      customer_id: string;
    }>('GET', `/subscriptions/${subscriptionId}`);
    return {
      id: subscription.id,
      state: subscription.state,
      setupOrderId: subscription.setup_order_id ?? null,
      customerId: subscription.customer_id,
    };
  }

  verifyWebhookSignature(rawBody: string, timestamp: string, signatureHeader: string): boolean {
    return verifyRevolutSignature(rawBody, timestamp, signatureHeader, this.webhookSecret);
  }

  parseWebhookPayload(rawBody: string): RevolutWebhookPayload {
    return parseRevolutWebhookPayload(rawBody);
  }

  private requireCheckoutUrl(
    orderId: string,
    checkoutUrl: string | undefined,
  ): { id: string; checkoutUrl: string } {
    if (!checkoutUrl) {
      this.logger.error(`Revolut returned order ${orderId} without a checkout_url`);
      throw new DomainError(
        'CHECKOUT_NOT_CONFIGURED',
        'The payment provider returned no checkout url.',
        { provider: ['no_checkout_url', `order ${orderId}`] },
      );
    }
    return { id: orderId, checkoutUrl };
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const [blocker] = this.config.blocking;
    if (blocker !== undefined) {
      throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
        provider: ['revolut_credentials_missing', `environment ${this.config.environment}`],
      });
    }

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Revolut-Api-Version': API_VERSION,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      const failure = describeRevolutFailure(error);
      this.logger.error(`Revolut request to ${path} failed: ${failure.providerDetail}`);
      throw toDomainError(failure);
    }

    if (!response.ok) {
      const detail = await response.text();
      const failure = describeRevolutFailure(
        new RevolutApiError(response.status, response.statusText, detail),
      );
      this.logger.error(`Revolut rejected ${method} ${path}: ${response.status} — ${detail}`);
      throw toDomainError(failure);
    }

    return (await response.json()) as T;
  }
}
