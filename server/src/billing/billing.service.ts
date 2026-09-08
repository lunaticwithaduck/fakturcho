import type {
  CheckoutProduct,
  CheckoutSessionDto,
  CreditPackId,
  SubscriptionDto,
  SubscriptionTierId,
} from '@fakturcho/shared-types';
import { CREDIT_PACKS, SUBSCRIPTION_TIER_IDS, SUBSCRIPTION_TIERS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { CreditLedgerReason, Prisma } from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RevolutService } from './revolut.service';
import type { RevolutWebhookPayload } from './revolut-webhook';
import { createSubscriptionCheckout } from './subscription-checkout';
import { REVOLUT_STATE_TO_PRISMA, toSubscriptionDto } from './subscription-mapping';
import { tierForVariationId } from './subscription-tiers';

function isSubscriptionTier(product: CheckoutProduct): product is SubscriptionTierId {
  return (SUBSCRIPTION_TIER_IDS as readonly string[]).includes(product);
}

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
    if (isSubscriptionTier(product)) {
      return createSubscriptionCheckout(
        this.prisma,
        this.revolut,
        accountId,
        product,
        billingReturnUrl(),
      );
    }
    const amountCents = CREDIT_PACKS[product as CreditPackId].eurCents;
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
        if (payload.orderId) await this.fulfilOrder(payload.orderId);
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

  private async fulfilOrder(orderId: string): Promise<void> {
    const order = await this.revolut.getOrder(orderId);
    if (order.state !== 'completed') return;
    if (order.subscriptionId) {
      await this.fulfilSubscriptionGrant(order.id, order.subscriptionId, order.amount);
      return;
    }
    const accountId = extractAccountId(order.metadata);
    const creditCents = extractCreditCents(order.metadata);
    if (!accountId || creditCents === null) return;
    await this.creditAccount(accountId, creditCents, CreditLedgerReason.PURCHASE, order.id);
  }

  private async fulfilSubscriptionGrant(
    orderId: string,
    subscriptionId: string,
    orderAmountCents: number,
  ): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { revolutSubscriptionId: subscriptionId },
    });
    if (!subscription) return;
    const tier = tierForVariationId(subscription.planId);
    const grantCents = tier ? SUBSCRIPTION_TIERS[tier].grantCents : orderAmountCents * 2;
    await this.creditAccount(
      subscription.accountId,
      grantCents,
      CreditLedgerReason.SUBSCRIPTION_GRANT,
      orderId,
    );
  }

  private async creditAccount(
    accountId: string,
    amountCents: number,
    reason: CreditLedgerReason,
    revolutOrderId: string,
  ): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.creditLedgerEntry.create({
          data: { accountId, amountCents, reason, revolutOrderId },
        }),
        this.prisma.account.update({
          where: { id: accountId },
          data: { creditBalanceCents: { increment: amountCents } },
        }),
      ]);
    } catch (error) {
      // SPEC §11 invariant 22/23: a duplicate delivery hits the revolutOrderId unique index
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
