import type {
  CheckoutProduct,
  CheckoutSessionDto,
  SubscriptionStatus as SharedSubscriptionStatus,
  SubscriptionDto,
} from '@fakturcho/shared-types';
import { CREDIT_PACKS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type {
  EventEntity,
  SubscriptionStatus as PaddleSubscriptionStatus,
  TransactionNotification,
} from '@paddle/paddle-node-sdk';
import { EventName } from '@paddle/paddle-node-sdk';
import type { Subscription } from '@prisma/client';
import {
  CreditLedgerReason,
  Prisma,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { PaddleService } from './paddle.service';

const STATUS_TO_DTO: Record<PrismaSubscriptionStatus, SharedSubscriptionStatus> = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
};

const PADDLE_STATUS_TO_PRISMA: Record<PaddleSubscriptionStatus, PrismaSubscriptionStatus> = {
  trialing: PrismaSubscriptionStatus.TRIALING,
  active: PrismaSubscriptionStatus.ACTIVE,
  past_due: PrismaSubscriptionStatus.PAST_DUE,
  canceled: PrismaSubscriptionStatus.CANCELED,
  paused: PrismaSubscriptionStatus.PAST_DUE,
};

const PRICE_ENV_BY_PRODUCT: Record<CheckoutProduct, string> = {
  subscription: 'PADDLE_SUBSCRIPTION_PRICE_ID',
  pack5: 'PADDLE_PRICE_PACK5',
  pack10: 'PADDLE_PRICE_PACK10',
  pack25: 'PADDLE_PRICE_PACK25',
};

function toDto(subscription: Subscription): SubscriptionDto {
  return {
    id: subscription.id,
    status: STATUS_TO_DTO[subscription.status],
    planId: subscription.planId,
    currentPeriodEnd: subscription.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null,
  };
}

function extractAccountId(customData: object | null): string | null {
  if (!customData) return null;
  const value = (customData as Record<string, unknown>).accountId;
  return typeof value === 'string' ? value : null;
}

function extractCreditCents(customData: object | null): number | null {
  if (!customData) return null;
  const value = (customData as Record<string, unknown>).creditCents;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paddle: PaddleService,
  ) {}

  async getSubscription(accountId: string): Promise<SubscriptionDto | null> {
    const subscription = await this.prisma.subscription.findUnique({ where: { accountId } });
    return subscription ? toDto(subscription) : null;
  }

  async createCheckout(accountId: string, product: CheckoutProduct): Promise<CheckoutSessionDto> {
    const envName = PRICE_ENV_BY_PRODUCT[product];
    const priceId = process.env[envName];
    if (!priceId) throw new Error(`${envName} is not configured`);
    const subscription = await this.prisma.subscription.findUnique({ where: { accountId } });
    const checkoutUrl = await this.paddle.createCheckoutTransaction({
      priceId,
      accountId,
      paddleCustomerId: subscription?.paddleCustomerId ?? null,
      creditCents: product === 'subscription' ? null : CREDIT_PACKS[product].eurCents,
    });
    return { checkoutUrl };
  }

  async handleWebhookEvent(event: EventEntity): Promise<void> {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCanceled: {
        const { data } = event;
        const accountId = extractAccountId(data.customData);
        if (!accountId) return;
        const subscriptionData = {
          status: PADDLE_STATUS_TO_PRISMA[data.status],
          paddleSubscriptionId: data.id,
          paddleCustomerId: data.customerId,
          currentPeriodEnd: data.currentBillingPeriod
            ? new Date(data.currentBillingPeriod.endsAt)
            : null,
        };
        await this.prisma.subscription.upsert({
          where: { accountId },
          create: { accountId, ...subscriptionData },
          update: subscriptionData,
        });
        return;
      }
      case EventName.TransactionCompleted:
        await this.fulfilCreditPurchase(event.data);
        return;
      default:
        return;
    }
  }

  private async fulfilCreditPurchase(transaction: TransactionNotification): Promise<void> {
    const accountId = extractAccountId(transaction.customData);
    const creditCents = extractCreditCents(transaction.customData);
    if (!accountId || creditCents === null) return;
    try {
      await this.prisma.$transaction([
        this.prisma.creditLedgerEntry.create({
          data: {
            accountId,
            amountCents: creditCents,
            reason: CreditLedgerReason.PURCHASE,
            paddleTransactionId: transaction.id,
          },
        }),
        this.prisma.account.update({
          where: { id: accountId },
          data: { creditBalanceCents: { increment: creditCents } },
        }),
      ]);
    } catch (error) {
      // SPEC §11 invariant 22: a duplicate delivery hits the paddleTransactionId unique index
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      throw error;
    }
  }
}
