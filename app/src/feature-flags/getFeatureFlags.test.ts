import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFeatureFlags } from './getFeatureFlags';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getFeatureFlags', () => {
  it('returns the flags reported by the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ EN_LOCALE: true, EINVOICE: true, PEPPOL: false }),
      }),
    );

    expect(await getFeatureFlags()).toEqual({ EN_LOCALE: true, EINVOICE: true, PEPPOL: false });
  });

  it('treats every flag as off when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    expect(await getFeatureFlags()).toEqual({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
  });

  it('treats every flag as off when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await getFeatureFlags()).toEqual({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
  });

  it('coerces a malformed body to all-off instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ EN_LOCALE: 'yes' }) }),
    );

    expect(await getFeatureFlags()).toEqual({ EN_LOCALE: false, EINVOICE: false, PEPPOL: false });
  });
});
