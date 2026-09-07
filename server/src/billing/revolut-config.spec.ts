import { describe, expect, it } from 'vitest';
import { inspectRevolutConfig } from './revolut-config';

const SECRET_KEY = 'sk_test_apikey_01abc';
const WEBHOOK_SECRET = 'wsk_test_01abc';

describe('inspectRevolutConfig', () => {
  it('defaults to sandbox when the environment is unset', () => {
    const report = inspectRevolutConfig({
      environment: undefined,
      apiKey: SECRET_KEY,
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(report.environment).toBe('sandbox');
    expect(report.baseUrl).toBe('https://sandbox-merchant.revolut.com/api');
    expect(report.blocking).toEqual([]);
  });

  it('resolves the production base url', () => {
    const report = inspectRevolutConfig({
      environment: 'production',
      apiKey: SECRET_KEY,
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(report.baseUrl).toBe('https://merchant.revolut.com/api');
  });

  it('blocks a missing api key', () => {
    const report = inspectRevolutConfig({
      environment: 'production',
      apiKey: '',
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(report.blocking[0]).toContain('REVOLUT_API_KEY is not set');
  });

  it('blocks an api key without the secret-key prefix — the public key pasted by mistake', () => {
    const report = inspectRevolutConfig({
      environment: 'production',
      apiKey: 'pk_test_apikey_01abc',
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(report.blocking[0]).toContain('sk_ prefix');
  });

  it('warns rather than blocks when the webhook secret is missing', () => {
    const report = inspectRevolutConfig({
      environment: 'production',
      apiKey: SECRET_KEY,
      webhookSecret: '',
    });
    expect(report.blocking).toEqual([]);
    expect(report.warnings[0]).toContain('never be fulfilled');
  });

  it('passes a matched pair', () => {
    const report = inspectRevolutConfig({
      environment: 'production',
      apiKey: SECRET_KEY,
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(report).toEqual({
      environment: 'production',
      baseUrl: 'https://merchant.revolut.com/api',
      blocking: [],
      warnings: [],
    });
  });
});
