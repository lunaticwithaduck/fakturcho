import { describe, expect, it } from 'vitest';
import { inspectPaddleConfig } from './paddle-config';

const SANDBOX_KEY = 'pdl_sdbx_apikey_01abc';
const LIVE_KEY = 'pdl_live_apikey_01abc';
const SECRET = 'pdl_ntfset_01abc';

describe('inspectPaddleConfig', () => {
  it('defaults to sandbox when the environment is unset', () => {
    const report = inspectPaddleConfig({
      environment: undefined,
      apiKey: SANDBOX_KEY,
      webhookSecret: SECRET,
    });
    expect(report.environment).toBe('sandbox');
    expect(report.blocking).toEqual([]);
  });

  it('blocks a sandbox key pointed at production — the switch people get wrong', () => {
    const report = inspectPaddleConfig({
      environment: 'production',
      apiKey: SANDBOX_KEY,
      webhookSecret: SECRET,
    });
    expect(report.blocking).toHaveLength(1);
    expect(report.blocking[0]).toContain('sandbox key');
  });

  it('blocks a live key pointed at sandbox', () => {
    const report = inspectPaddleConfig({
      environment: 'sandbox',
      apiKey: LIVE_KEY,
      webhookSecret: SECRET,
    });
    expect(report.blocking[0]).toContain('live key');
  });

  it('blocks a missing api key', () => {
    const report = inspectPaddleConfig({
      environment: 'production',
      apiKey: '',
      webhookSecret: SECRET,
    });
    expect(report.blocking[0]).toContain('PADDLE_API_KEY is not set');
  });

  it('warns rather than blocks when the webhook secret is missing', () => {
    const report = inspectPaddleConfig({
      environment: 'production',
      apiKey: LIVE_KEY,
      webhookSecret: '',
    });
    expect(report.blocking).toEqual([]);
    expect(report.warnings[0]).toContain('never be fulfilled');
  });

  it('passes a matched live pair', () => {
    const report = inspectPaddleConfig({
      environment: 'production',
      apiKey: LIVE_KEY,
      webhookSecret: SECRET,
    });
    expect(report).toEqual({ environment: 'production', blocking: [], warnings: [] });
  });
});
