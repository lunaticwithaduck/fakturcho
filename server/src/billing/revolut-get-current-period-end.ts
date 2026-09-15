import type { Logger } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { describeRevolutFailure, RevolutApiError, toDomainError } from './revolut-errors';
import { getRevolutSubscriptionOrNull } from './revolut-get-subscription';

const API_VERSION = '2024-09-01';

// the renewal date lives on the subscription's current cycle, not the subscription itself
export async function getRevolutCurrentPeriodEnd(
  input: {
    baseUrl: string;
    apiKey: string;
    blocking: string[];
    environment: string;
  },
  subscriptionId: string,
  logger: Logger,
): Promise<Date | null> {
  const subscription = await getRevolutSubscriptionOrNull(input, subscriptionId, logger);
  if (!subscription?.currentCycleId) return null;

  const [blocker] = input.blocking;
  if (blocker !== undefined) {
    throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
      provider: ['revolut_credentials_missing', `environment ${input.environment}`],
    });
  }

  const path = `/subscriptions/${subscriptionId}/cycles/${subscription.currentCycleId}`;
  let response: Response;
  try {
    response = await fetch(`${input.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Revolut-Api-Version': API_VERSION,
      },
    });
  } catch (error) {
    const failure = describeRevolutFailure(error);
    logger.error(
      `Revolut request to fetch subscription cycle ${path} failed: ${failure.providerDetail}`,
    );
    throw toDomainError(failure);
  }

  if (!response.ok) {
    const detail = await response.text();
    const failure = describeRevolutFailure(
      new RevolutApiError(response.status, response.statusText, detail),
    );
    logger.error(
      `Revolut rejected fetch subscription cycle ${path}: ${response.status} — ${detail}`,
    );
    throw toDomainError(failure);
  }

  const cycle = (await response.json()) as { id: string; state: string; end_date?: string };
  return cycle.end_date ? new Date(cycle.end_date) : null;
}
