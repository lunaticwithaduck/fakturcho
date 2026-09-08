import type {
  MrrSummary,
  SubscriptionStatusFilter,
  SubscriptionSummary,
} from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DTO_TO_STATUS, STATUS_TO_DTO } from '../billing/subscription-mapping';
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
    const grouped = await this.prisma.subscription.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const counts: MrrSummary = {
      mrrCents: 0,
      activeCount: 0,
      trialingCount: 0,
      pastDueCount: 0,
      canceledCount: 0,
    };

    for (const group of grouped) {
      const status = STATUS_TO_DTO[group.status];
      if (status === 'active') counts.activeCount = group._count._all;
      if (status === 'trialing') counts.trialingCount = group._count._all;
      if (status === 'past_due') counts.pastDueCount = group._count._all;
      if (status === 'canceled') counts.canceledCount = group._count._all;
    }

    return counts;
  }
}
