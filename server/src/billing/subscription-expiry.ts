import { Logger } from '@nestjs/common';
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
    where: { status: PrismaSubscriptionStatus.TRIALING },
  });

  let touched = 0;

  for (const sub of candidates) {
    const staleSince = sub.checkoutStartedAt ?? sub.updatedAt;
    if (staleSince.getTime() > cutoff) continue;
    const ageHours = Math.round((now.getTime() - staleSince.getTime()) / 3_600_000);

    try {
      if (!sub.revolutSubscriptionId) {
        await cancelLocally(prisma, sub.id);
        logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=no_revolut_id`);
        touched++;
        continue;
      }

      const revolutSub = await revolut.getSubscriptionOrNull(sub.revolutSubscriptionId);

      if (revolutSub === null) {
        await cancelLocally(prisma, sub.id);
        logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=not_found`);
        touched++;
        continue;
      }

      if (revolutSub.state === 'pending') {
        await revolut.cancelSubscription(sub.revolutSubscriptionId);
        await cancelLocally(prisma, sub.id);
        logger.log(`subscription ${sub.id} age=${ageHours}h action=canceled reason=still_pending`);
        touched++;
        continue;
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
        touched++;
      }
    } catch (error) {
      logger.error(`subscription ${sub.id} expiry check failed: ${errorMessage(error)}`);
    }
  }

  if (touched > 0) {
    logger.log(`subscription expiry sweep: ${touched}/${candidates.length} stale pending updated`);
  }
}

function cancelLocally(prisma: PrismaService, id: string): Promise<unknown> {
  return prisma.subscription.update({
    where: { id },
    data: { status: PrismaSubscriptionStatus.CANCELED, checkoutUrl: null },
  });
}
