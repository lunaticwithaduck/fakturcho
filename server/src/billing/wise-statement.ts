import { randomBytes } from 'node:crypto';
import { DomainError } from '../common/domain-error';

// Wise's balance-update webhook is a bare poke (profile/balance id + when) — it carries no amount
// or reference, so reconciliation is a second call to the statement API, matched by whichever of
// these fields the payer's bank actually populated (varies by sending bank/rail).
export interface WiseStatementTransaction {
  type: string; // 'CREDIT' | 'DEBIT'
  date: string;
  amount: { value: number; currency: string };
  referenceNumber?: string;
  details?: { paymentReference?: string; description?: string };
}

export interface WiseStatementResponse {
  transactions: WiseStatementTransaction[];
}

export async function fetchStatement(input: {
  apiBase: string;
  apiToken: string;
  profileId: string;
  balanceId: string;
  lookbackMs: number;
}): Promise<WiseStatementResponse> {
  const intervalEnd = new Date();
  const intervalStart = new Date(Date.now() - input.lookbackMs);
  const url =
    `${input.apiBase}/v1/profiles/${input.profileId}/balance-statements/${input.balanceId}` +
    `/statement.json?currency=EUR&intervalStart=${intervalStart.toISOString()}` +
    `&intervalEnd=${intervalEnd.toISOString()}&type=COMPACT`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${input.apiToken}` } });
  } catch (error) {
    throw new DomainError('PAYMENT_PROVIDER_UNREACHABLE', 'The payment provider did not respond.', {
      provider: ['wise_statement_fetch_failed', (error as Error).message],
    });
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new DomainError(
      'PAYMENT_PROVIDER_ERROR',
      'The payment provider rejected the statement request.',
      { provider: [`status ${response.status}`, body.slice(0, 200)] },
    );
  }
  return (await response.json()) as WiseStatementResponse;
}

export function extractReferenceCandidates(tx: WiseStatementTransaction): string[] {
  const candidates = [tx.details?.paymentReference, tx.details?.description, tx.referenceNumber];
  return candidates.filter((c): c is string => typeof c === 'string' && c.length > 0);
}

export function generateReference(): string {
  // FKT-XXXXXXXX, uppercase base32-ish — short enough for a payer to retype correctly into a bank
  // transfer reference field, unlikely to collide, easy to spot inside truncated bank descriptions.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — human transcription errors
  const bytes = randomBytes(8);
  let code = '';
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `FKT-${code}`;
}
