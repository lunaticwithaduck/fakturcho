import type { CheckoutProduct, CheckoutSessionDto, SubscriptionDto } from '@fakturcho/shared-types';
import { CREDIT_PACKS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import {
  CreditLedgerReason,
  Prisma,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from '@prisma/client';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RevolutService } from './revolut.service';
import type { RevolutWebhookPayload } from './revolut-webhook';
import { REVOLUT_STATE_TO_PRISMA, toSubscriptionDto } from './subscription-mapping';

function extractAccountId(metadata: Record<string, unknown>): string | null {
  const value = metadata.accountId;
  return typeof value === 'string' ? value : null;
}

function extractCreditCents(metadata: Record<string, unknown>): number | null {
  const raw = metadata.creditCents;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
  return Number.isInteger(value) && value > 0 ? value : null;
}

function billingReturnUrl(): string {
  const origin = (process.env.APP_ORIGINS ?? 'http://localhost:3000').split(',')[0];
  return `${origin}/billing`;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revolut: RevolutService,
  ) {}

  async getSubscription(accountId: string): Promise<SubscriptionDto | null> {
    const subscription = await this.prisma.subscription.findUnique({ where: { accountId } });
    return subscription ? toSubscriptionDto(subscription) : null;
  }

  async createCheckout(accountId: string, product: CheckoutProduct): Promise<CheckoutSessionDto> {
    if (product === 'subscription') return this.createSubscriptionCheckout(accountId);
    const amountCents = CREDIT_PACKS[product].eurCents;
    const order = await this.revolut.createCreditOrder({
      amountCents,
      currency: 'EUR',
      extRef: `credit_pack:${product}:${accountId}`,
      metadata: { accountId, creditCents: String(amountCents) },
      redirectUrl: billingReturnUrl(),
    });
    return { checkoutUrl: order.checkoutUrl };
  }

  async handleWebhookEvent(payload: RevolutWebhookPayload): Promise<void> {
    switch (payload.event) {
      case 'ORDER_COMPLETED':
        if (payload.orderId) await this.fulfilCreditPurchase(payload.orderId);
        return;
      case 'SUBSCRIPTION_INITIATED':
      case 'SUBSCRIPTION_FINISHED':
      case 'SUBSCRIPTION_CANCELLED':
      case 'SUBSCRIPTION_OVERDUE':
        if (payload.subscriptionId) await this.syncSubscription(payload.subscriptionId);
        return;
      default:
        return;
    }
  }

  private async createSubscriptionCheckout(accountId: string): Promise<CheckoutSessionDto> {
    const planVariationId = process.env.REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID;
    if (!planVariationId) {
      throw new DomainError(
        'CHECKOUT_NOT_CONFIGURED',
        'REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID is not set on the api service, so the subscription cannot be sold.',
        { provider: ['missing_plan_variation_env', 'REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID'] },
      );
    }

    const existing = await this.prisma.subscription.findUnique({ where: { accountId } });
    const customerId = existing?.revolutCustomerId ?? (await this.createCustomer(accountId));

    const subscription = await this.revolut.createSubscription({
      planVariationId,
      customerId,
      externalReference: accountId,
      setupOrderRedirectUrl: billingReturnUrl(),
    });

    const subscriptionData = {
      status: REVOLUT_STATE_TO_PRISMA[subscription.state] ?? PrismaSubscriptionStatus.TRIALING,
      revolutSubscriptionId: subscription.id,
      revolutCustomerId: customerId,
      planId: planVariationId,
      currentPeriodEnd: null,
    };
    await this.prisma.subscription.upsert({
      where: { accountId },
      create: { accountId, ...subscriptionData },
      update: subscriptionData,
    });

    if (!subscription.setupOrderId) {
      throw new DomainError(
        'CHECKOUT_NOT_CONFIGURED',
        'Revolut returned a subscription without a setup order to check out.',
        { provider: ['no_setup_order', `subscription ${subscription.id}`] },
      );
    }
    const setupOrder = await this.revolut.getOrder(subscription.setupOrderId);
    if (!setupOrder.checkoutUrl) {
      throw new DomainError(
        'CHECKOUT_NOT_CONFIGURED',
        'Revolut returned no checkout url for the subscription setup order.',
        { provider: ['no_checkout_url', `order ${setupOrder.id}`] },
      );
    }
    return { checkoutUrl: setupOrder.checkoutUrl };
  }

  private async createCustomer(accountId: string): Promise<string> {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { users: { take: 1 } },
    });
    const user = account.users[0];
    const customer = await this.revolut.createCustomer({
      fullName: user?.name ?? accountId,
      email: user?.email ?? `${accountId}@fakturcho.invalid`,
    });
    return customer.id;
  }

  private async fulfilCreditPurchase(orderId: string): Promise<void> {
    const order = await this.revolut.getOrder(orderId);
    if (order.state !== 'completed') return;
    const accountId = extractAccountId(order.metadata);
    const creditCents = extractCreditCents(order.metadata);
    if (!accountId || creditCents === null) return;
    try {
      await this.prisma.$transaction([
        this.prisma.creditLedgerEntry.create({
          data: {
            accountId,
            amountCents: creditCents,
            reason: CreditLedgerReason.PURCHASE,
            revolutOrderId: order.id,
          },
        }),
        this.prisma.account.update({
          where: { id: accountId },
          data: { creditBalanceCents: { increment: creditCents } },
        }),
      ]);
    } catch (error) {
      // SPEC §11 invariant 22: a duplicate delivery hits the revolutOrderId unique index
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
  }

  private async syncSubscription(subscriptionId: string): Promise<void> {
    const existing = await this.prisma.subscription.findUnique({
      where: { revolutSubscriptionId: subscriptionId },
    });
    if (!existing) return;
    const subscription = await this.revolut.getSubscription(subscriptionId);
    const status = REVOLUT_STATE_TO_PRISMA[subscription.state];
    if (!status) return;
    await this.prisma.subscription.update({
      where: { revolutSubscriptionId: subscriptionId },
      data: { status },
    });
  }
}
