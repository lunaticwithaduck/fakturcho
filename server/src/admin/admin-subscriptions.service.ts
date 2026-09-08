import type {
  MrrSummary,
  SubscriptionStatusFilter,
  SubscriptionSummary,
} from '@fakturcho/shared-types';
import { SUBSCRIPTION_TIERS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DTO_TO_STATUS, STATUS_TO_DTO } from '../billing/subscription-mapping';
import { tierForVariationId } from '../billing/subscription-tiers';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toSubscriptionSummary } from './admin-subscriptions.mapper';

const SUBSCRIPTION_INCLUDE = {
  account: {
    include: {
      issuerProfile: true,
      users: { orderBy: { createdAt: 'asc' as const }, take: 1, select: { email: true } },
    },
  },
} satisfies Prisma.SubscriptionInclude;

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status: Exclude<SubscriptionStatusFilter, 'none'>): Promise<SubscriptionSummary[]> {
    const where: Prisma.SubscriptionWhereInput =
      status === 'all' ? {} : { status: DTO_TO_STATUS[status] };
    const rows = await this.prisma.subscription.findMany({
      where,
      include: SUBSCRIPTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSubscriptionSummary);
  }

  async summary(): Promise<MrrSummary> {
    const rows = await this.prisma.subscription.findMany({
      select: { status: true, planId: true },
    });

    const counts: MrrSummary = {
      mrrCents: 0,
      activeCount: 0,
      trialingCount: 0,
      pastDueCount: 0,
      canceledCount: 0,
    };

    for (const row of rows) {
      const status = STATUS_TO_DTO[row.status];
      if (status === 'active') {
        counts.activeCount += 1;
        const tier = tierForVariationId(row.planId);
        counts.mrrCents += tier ? SUBSCRIPTION_TIERS[tier].priceCents : 0;
      }
      if (status === 'trialing') counts.trialingCount += 1;
      if (status === 'past_due') counts.pastDueCount += 1;
      if (status === 'canceled') counts.canceledCount += 1;
    }

    return counts;
  }
}
