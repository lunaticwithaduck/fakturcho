import { createHmac, timingSafeEqual } from 'node:crypto';

export interface RevolutWebhookPayload {
  event: string;
  orderId: string | null;
  subscriptionId: string | null;
}

export function verifyRevolutSignature(
  rawBody: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret).update(`v1.${timestamp}.${rawBody}`).digest('hex');
  const candidates = signatureHeader.split(',').map((part) => part.trim());
  return candidates.some((candidate) => {
    const [version, value] = candidate.split('=');
    if (version !== 'v1' || !value) return false;
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export function parseRevolutWebhookPayload(rawBody: string): RevolutWebhookPayload {
  const body = JSON.parse(rawBody) as Record<string, unknown>;
  return {
    event: typeof body.event === 'string' ? body.event : '',
    orderId: typeof body.order_id === 'string' ? body.order_id : null,
    subscriptionId: typeof body.subscription_id === 'string' ? body.subscription_id : null,
  };
}
