import type { Subscription } from '@prisma/client';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { RevolutService } from './revolut.service';
import { REVOLUT_STATE_TO_PRISMA } from './subscription-mapping';

export function findSubscriptionByRevolutId(
  prisma: PrismaService,
  revolutSubscriptionId: string,
): Promise<Subscription | null> {
  return prisma.subscription.findFirst({
    where: {
      OR: [{ revolutSubscriptionId }, { pendingRevolutSubscriptionId: revolutSubscriptionId }],
    },
  });
}

// an auxiliary read: if Revolut can't be reached, leave whatever currentPeriodEnd already holds
export async function fetchCurrentPeriodEnd(
  revolut: RevolutService,
  subscriptionId: string,
): Promise<Date | null | undefined> {
  try {
    return await revolut.getCurrentPeriodEnd(subscriptionId);
  } catch {
    return undefined;
  }
}

// drops the old Revolut subscription, then promotes the paid upgrade to the primary
// plan; cancelling is idempotent, so a failure part-way retries on the next webhook
export async function activatePendingUpgrade(
  prisma: PrismaService,
  revolut: RevolutService,
  subscription: Subscription,
  newRevolutSubscriptionId: string,
): Promise<void> {
  const oldRevolutSubscriptionId = subscription.revolutSubscriptionId;
  if (oldRevolutSubscriptionId) {
    await revolut.cancelSubscription(oldRevolutSubscriptionId);
  }
  const currentPeriodEnd = (await fetchCurrentPeriodEnd(revolut, newRevolutSubscriptionId)) ?? null;
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: PrismaSubscriptionStatus.ACTIVE,
      planId: subscription.pendingPlanId,
      revolutSubscriptionId: newRevolutSubscriptionId,
      revolutSetupOrderId: subscription.pendingRevolutSetupOrderId,
      checkoutUrl: null,
      checkoutStartedAt: null,
      currentPeriodEnd,
      pendingPlanId: null,
      pendingRevolutSubscriptionId: null,
      pendingRevolutSetupOrderId: null,
      pendingCheckoutUrl: null,
      pendingCheckoutStartedAt: null,
    },
  });
}

// a pending upgrade's own lifecycle events never touch the active plan's status
export async function syncPendingUpgrade(
  prisma: PrismaService,
  revolut: RevolutService,
  existing: Subscription,
  subscriptionId: string,
): Promise<void> {
  const pending = await revolut.getSubscriptionOrNull(subscriptionId);
  if (!pending) return;
  const mapped = REVOLUT_STATE_TO_PRISMA[pending.state];
  if (mapped === PrismaSubscriptionStatus.ACTIVE) {
    await activatePendingUpgrade(prisma, revolut, existing, subscriptionId);
    return;
  }
  if (mapped === PrismaSubscriptionStatus.CANCELED) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        pendingPlanId: null,
        pendingRevolutSubscriptionId: null,
        pendingRevolutSetupOrderId: null,
        pendingCheckoutUrl: null,
        pendingCheckoutStartedAt: null,
      },
    });
  }
}
