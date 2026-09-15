import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isEnLocaleEnabled, resetEnLocaleCache } from './enLocaleCache';

beforeEach(() => {
  resetEnLocaleCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('isEnLocaleEnabled', () => {
  it('reflects the flag from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ EN_LOCALE: true }) }),
    );
    expect(await isEnLocaleEnabled()).toBe(true);
  });

  it('caches the result instead of fetching on every call', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ EN_LOCALE: true }) });
    vi.stubGlobal('fetch', fetchMock);

    await isEnLocaleEnabled();
    await isEnLocaleEnabled();
    await isEnLocaleEnabled();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails soft to false when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    expect(await isEnLocaleEnabled()).toBe(false);
  });

  it('refetches after the cache expires', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ EN_LOCALE: true }) });
    vi.stubGlobal('fetch', fetchMock);

    await isEnLocaleEnabled();
    vi.advanceTimersByTime(61_000);
    await isEnLocaleEnabled();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
