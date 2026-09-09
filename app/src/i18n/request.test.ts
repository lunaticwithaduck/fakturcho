import bgMessages from '@messages/bg.json';
import { describe, expect, it } from 'vitest';
import { buildRequestConfig } from './request';

describe('buildRequestConfig', () => {
  it('resolves the static Bulgarian default without touching cookies or headers', async () => {
    const config = await buildRequestConfig();

    expect(config.locale).toBe('bg');
    expect(config.messages).toEqual(bgMessages);
  });
});
