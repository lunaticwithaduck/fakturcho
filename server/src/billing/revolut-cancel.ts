import type { Logger } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { describeRevolutFailure, RevolutApiError, toDomainError } from './revolut-errors';

const API_VERSION = '2024-09-01';

export async function cancelRevolutSubscription(
  input: {
    baseUrl: string;
    apiKey: string;
    blocking: string[];
    environment: string;
  },
  subscriptionId: string,
  logger: Logger,
): Promise<void> {
  const [blocker] = input.blocking;
  if (blocker !== undefined) {
    throw new DomainError('CHECKOUT_NOT_CONFIGURED', blocker, {
      provider: ['revolut_credentials_missing', `environment ${input.environment}`],
    });
  }

  let response: Response;
  try {
    response = await fetch(`${input.baseUrl}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Revolut-Api-Version': API_VERSION,
      },
    });
  } catch (error) {
    const failure = describeRevolutFailure(error);
    logger.error(
      `Revolut request to cancel subscription ${subscriptionId} failed: ${failure.providerDetail}`,
    );
    throw toDomainError(failure);
  }

  if (response.ok || response.status === 404) return;
  const detail = await response.text();
  if (/cancel|finish/i.test(detail)) return;
  const failure = describeRevolutFailure(
    new RevolutApiError(response.status, response.statusText, detail),
  );
  logger.error(
    `Revolut rejected cancel subscription ${subscriptionId}: ${response.status} — ${detail}`,
  );
  throw toDomainError(failure);
}
