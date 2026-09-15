import type { Logger } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { describeRevolutFailure, RevolutApiError, toDomainError } from './revolut-errors';
import type { RevolutSubscription } from './revolut-types';

const API_VERSION = '2024-09-01';

// distinct from RevolutService.getSubscription: callers here need to tell "gone" apart
// from other failures, so a 404 comes back as null instead of a thrown error.
export async function getRevolutSubscriptionOrNull(
  input: {
    baseUrl: string;
    apiKey: string;
    blocking: string[];
    environment: string;
  },
  subscriptionId: string,
  logger: Logger,
): Promise<RevolutSubscription | null> {
  const [blocker] = input.blocking;
  if (blocker !== undefined) {
    throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
      provider: ['revolut_credentials_missing', `environment ${input.environment}`],
    });
  }

  let response: Response;
  try {
    response = await fetch(`${input.baseUrl}/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Revolut-Api-Version': API_VERSION,
      },
    });
  } catch (error) {
    const failure = describeRevolutFailure(error);
    logger.error(
      `Revolut request to fetch subscription ${subscriptionId} failed: ${failure.providerDetail}`,
    );
    throw toDomainError(failure);
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    const detail = await response.text();
    const failure = describeRevolutFailure(
      new RevolutApiError(response.status, response.statusText, detail),
    );
    logger.error(
      `Revolut rejected fetch subscription ${subscriptionId}: ${response.status} — ${detail}`,
    );
    throw toDomainError(failure);
  }

  const subscription = (await response.json()) as {
    id: string;
    state: string;
    setup_order_id?: string;
    customer_id: string;
    current_cycle_id?: string;
  };
  return {
    id: subscription.id,
    state: subscription.state,
    setupOrderId: subscription.setup_order_id ?? null,
    customerId: subscription.customer_id,
    currentCycleId: subscription.current_cycle_id ?? null,
  };
}
