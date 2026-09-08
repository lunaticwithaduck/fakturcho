import type { CheckoutSessionDto, SubscriptionTierId } from '@fakturcho/shared-types';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import type { RevolutService } from './revolut.service';
import { REVOLUT_STATE_TO_PRISMA } from './subscription-mapping';
import { variationIdFor } from './subscription-tiers';

export async function createSubscriptionCheckout(
  prisma: PrismaService,
  revolut: RevolutService,
  accountId: string,
  tier: SubscriptionTierId,
  returnUrl: string,
): Promise<CheckoutSessionDto> {
  const planVariationId = variationIdFor(tier);

  const existing = await prisma.subscription.findUnique({ where: { accountId } });
  const customerId =
    existing?.revolutCustomerId ?? (await createCustomer(prisma, revolut, accountId));

  const subscription = await revolut.createSubscription({
    planVariationId,
    customerId,
    externalReference: accountId,
    setupOrderRedirectUrl: returnUrl,
  });

  const subscriptionData = {
    status: REVOLUT_STATE_TO_PRISMA[subscription.state] ?? PrismaSubscriptionStatus.TRIALING,
    revolutSubscriptionId: subscription.id,
    revolutCustomerId: customerId,
    planId: planVariationId,
    currentPeriodEnd: null,
  };
  await prisma.subscription.upsert({
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
  const setupOrder = await revolut.getOrder(subscription.setupOrderId);
  if (!setupOrder.checkoutUrl) {
    throw new DomainError(
      'CHECKOUT_NOT_CONFIGURED',
      'Revolut returned no checkout url for the subscription setup order.',
      { provider: ['no_checkout_url', `order ${setupOrder.id}`] },
    );
  }
  return { checkoutUrl: setupOrder.checkoutUrl };
}

async function createCustomer(
  prisma: PrismaService,
  revolut: RevolutService,
  accountId: string,
): Promise<string> {
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
    include: { users: { take: 1 } },
  });
  const user = account.users[0];
  const customer = await revolut.createCustomer({
    fullName: user?.name ?? accountId,
    email: user?.email ?? `${accountId}@fakturcho.invalid`,
  });
  return customer.id;
}
