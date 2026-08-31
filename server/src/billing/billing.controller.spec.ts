import { describe, expect, it, vi } from 'vitest';
import { BillingController } from './billing.controller';
import type { CreditsService } from './credits.service';
import type { WiseService } from './wise.service';

function controllerWith(wise: Partial<WiseService>): BillingController {
  return new BillingController({} as CreditsService, wise as WiseService);
}

function requestWith(body: unknown): { rawBody?: Buffer } {
  return { rawBody: Buffer.from(JSON.stringify(body)) };
}

describe('BillingController.handleWebhook', () => {
  it('acknowledges an unsigned request without processing it — Wise\'s own "is this URL reachable" check never carries a signature', async () => {
    const handleBalanceUpdateWebhook = vi.fn();
    const controller = controllerWith({ handleBalanceUpdateWebhook });

    const result = await controller.handleWebhook(
      requestWith({ event_type: 'balances#update' }) as never,
      undefined,
    );

    expect(result).toEqual({ received: true });
    expect(handleBalanceUpdateWebhook).not.toHaveBeenCalled();
  });

  it('rejects a signed request whose signature does not verify', async () => {
    const verifyWebhookSignature = vi.fn().mockReturnValue(false);
    const handleBalanceUpdateWebhook = vi.fn();
    const controller = controllerWith({ verifyWebhookSignature, handleBalanceUpdateWebhook });

    await expect(
      controller.handleWebhook(requestWith({}) as never, 'bad-signature'),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(handleBalanceUpdateWebhook).not.toHaveBeenCalled();
  });

  it('processes a request with a verified signature', async () => {
    const verifyWebhookSignature = vi.fn().mockReturnValue(true);
    const handleBalanceUpdateWebhook = vi.fn().mockResolvedValue(undefined);
    const controller = controllerWith({ verifyWebhookSignature, handleBalanceUpdateWebhook });
    const body = { event_type: 'balances#update' };

    const result = await controller.handleWebhook(requestWith(body) as never, 'good-signature');

    expect(result).toEqual({ received: true });
    expect(handleBalanceUpdateWebhook).toHaveBeenCalledWith(body);
  });
});
