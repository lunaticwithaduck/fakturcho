import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { describe, expect, it, vi } from 'vitest';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));

import { buildRequestConfig } from './request';

function stubHeader(value: string | null) {
  headersMock.mockResolvedValue({ get: (name: string) => (name === 'x-locale' ? value : null) });
}

describe('buildRequestConfig', () => {
  it('resolves Bulgarian when the middleware sets no locale header', async () => {
    stubHeader(null);

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
    expect(config.messages).toEqual(bgMessages);
  });

  it('resolves English when the middleware marks the request en', async () => {
    stubHeader('en');

    const config = await buildRequestConfig();

    expect(config.locale).toBe('en');
    expect(config.messages).toEqual(enMessages);
  });

  it('falls back to Bulgarian for an unrecognized header value', async () => {
    stubHeader('fr');

    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
  });
});
