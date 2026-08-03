import type {
  CheckoutSessionDto,
  SubscriptionStatus as SharedSubscriptionStatus,
  SubscriptionDto,
} from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type {
  EventEntity,
  SubscriptionStatus as PaddleSubscriptionStatus,
} from '@paddle/paddle-node-sdk';
import { EventName } from '@paddle/paddle-node-sdk';
import type { Subscription } from '@prisma/client';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
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

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paddle: PaddleService,
  ) {}

  async getSubscription(accountId: string): Promise<SubscriptionDto> {
    const subscription = await this.prisma.subscription.findUnique({ where: { accountId } });
    if (!subscription) throw new DomainError('NOT_FOUND', 'Subscription not found');
    return toDto(subscription);
  }

  async createCheckout(accountId: string): Promise<CheckoutSessionDto> {
    const priceId = process.env.PADDLE_PRICE_ID;
    if (!priceId) throw new Error('PADDLE_PRICE_ID is not configured');
    const subscription = await this.prisma.subscription.findUnique({ where: { accountId } });
    const checkoutUrl = await this.paddle.createCheckoutTransaction({
      priceId,
      accountId,
      paddleCustomerId: subscription?.paddleCustomerId ?? null,
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
        await this.prisma.subscription.updateMany({
          where: { accountId },
          data: {
            status: PADDLE_STATUS_TO_PRISMA[data.status],
            paddleSubscriptionId: data.id,
            paddleCustomerId: data.customerId,
            currentPeriodEnd: data.currentBillingPeriod
              ? new Date(data.currentBillingPeriod.endsAt)
              : null,
          },
        });
        return;
      }
      default:
        return;
    }
  }
}
