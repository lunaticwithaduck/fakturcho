import { Logger } from '@nestjs/common';
import type { Subscription as SubscriptionRow } from '@prisma/client';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { RevolutService } from './revolut.service';
import { REVOLUT_STATE_TO_PRISMA } from './subscription-mapping';

export const PENDING_CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;

const logger = new Logger('SubscriptionExpiry');

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function expireStalePendingSubscriptions(
  prisma: PrismaService,
  revolut: RevolutService,
  now: Date,
): Promise<void> {
  const cutoff = now.getTime() - PENDING_CHECKOUT_TTL_MS;
  const candidates = await prisma.subscription.findMany({
    where: {
      OR: [
        { status: PrismaSubscriptionStatus.TRIALING },
        { pendingRevolutSubscriptionId: { not: null } },
      ],
    },
  });

  let touched = 0;

  for (const sub of candidates) {
    try {
      if (sub.status === PrismaSubscriptionStatus.TRIALING) {
        if (await expireInitialCheckout(prisma, revolut, sub, now, cutoff)) touched++;
      }
      if (sub.pendingRevolutSubscriptionId) {
        if (await expirePendingUpgrade(prisma, revolut, sub, now, cutoff)) touched++;
      }
    } catch (error) {
      logger.error(`subscription ${sub.id} expiry check failed: ${errorMessage(error)}`);
    }
  }

  if (touched > 0) {
    logger.log(`subscription expiry sweep: ${touched}/${candidates.length} stale pending updated`);
  }
}

// the never-activated first checkout for an account: past 24h with no payment, drop it
async function expireInitialCheckout(
  prisma: PrismaService,
  revolut: RevolutService,
  sub: SubscriptionRow,
  now: Date,
  cutoff: number,
): Promise<boolean> {
  const staleSince = sub.checkoutStartedAt ?? sub.updatedAt;
  if (staleSince.getTime() > cutoff) return false;
  const ageHours = Math.round((now.getTime() - staleSince.getTime()) / 3_600_000);

  if (!sub.revolutSubscriptionId) {
    await cancelLocally(prisma, sub.id);
    logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=no_revolut_id`);
    return true;
  }

  const revolutSub = await revolut.getSubscriptionOrNull(sub.revolutSubscriptionId);

  if (revolutSub === null) {
    await cancelLocally(prisma, sub.id);
    logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=not_found`);
    return true;
  }

  if (revolutSub.state === 'pending') {
    await revolut.cancelSubscription(sub.revolutSubscriptionId);
    await cancelLocally(prisma, sub.id);
    logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=still_pending`);
    return true;
  }

  const mapped = REVOLUT_STATE_TO_PRISMA[revolutSub.state];
  if (mapped && mapped !== sub.status) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data:
        mapped === PrismaSubscriptionStatus.ACTIVE
          ? { status: mapped, checkoutUrl: null }
          : { status: mapped },
    });
    logger.log(
      `subscription ${sub.id} age=${ageHours}h action=synced status=${mapped} revolut_state=${revolutSub.state}`,
    );
    return true;
  }

  return false;
}

// an upgrade checkout abandoned for 24h: cancel only the pending Revolut subscription,
// the active/past-due plan underneath it is never touched
async function expirePendingUpgrade(
  prisma: PrismaService,
  revolut: RevolutService,
  sub: SubscriptionRow,
  now: Date,
  cutoff: number,
): Promise<boolean> {
  const revolutSubscriptionId = sub.pendingRevolutSubscriptionId;
  if (!revolutSubscriptionId) return false;
  const staleSince = sub.pendingCheckoutStartedAt ?? sub.updatedAt;
  if (staleSince.getTime() > cutoff) return false;
  const ageHours = Math.round((now.getTime() - staleSince.getTime()) / 3_600_000);

  const revolutSub = await revolut.getSubscriptionOrNull(revolutSubscriptionId);
  if (revolutSub !== null && revolutSub.state !== 'pending') {
    // already active or cancelled at Revolut: let the webhook/activation path settle it
    return false;
  }

  if (revolutSub !== null) {
    await revolut.cancelSubscription(revolutSubscriptionId);
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      pendingPlanId: null,
      pendingRevolutSubscriptionId: null,
      pendingRevolutSetupOrderId: null,
      pendingCheckoutUrl: null,
      pendingCheckoutStartedAt: null,
    },
  });
  logger.log(
    `subscription ${sub.id} age=${ageHours}h action=upgrade_canceled reason=still_pending`,
  );
  return true;
}

function cancelLocally(prisma: PrismaService, id: string): Promise<unknown> {
  return prisma.subscription.update({
    where: { id },
    data: { status: PrismaSubscriptionStatus.CANCELED, checkoutUrl: null },
  });
}
