import { describe, expect, it } from 'vitest';
import {
  inspectWiseConfig,
  resolveWebhookPublicKey,
  WISE_SANDBOX_WEBHOOK_PUBLIC_KEY,
} from './wise-config';

const VALID = {
  environment: 'sandbox',
  apiToken: 'wise_token',
  profileId: '123',
  balanceId: '456',
  iban: 'BE00000000000000',
  accountHolderName: 'Fakturcho',
  webhookPublicKey: '',
};

describe('inspectWiseConfig', () => {
  it('defaults to sandbox when the environment is unset and warns (not blocks) on a missing key', () => {
    const report = inspectWiseConfig({ ...VALID, environment: undefined });
    expect(report.environment).toBe('sandbox');
    expect(report.blocking).toEqual([]);
    expect(report.warnings[0]).toContain('published sandbox key');
  });

  it('blocks a missing api token', () => {
    const report = inspectWiseConfig({ ...VALID, apiToken: '' });
    expect(report.blocking).toContain('WISE_API_TOKEN is not set');
  });

  it('blocks a missing profile id', () => {
    const report = inspectWiseConfig({ ...VALID, profileId: '' });
    expect(report.blocking).toContain('WISE_PROFILE_ID is not set');
  });

  it('blocks a missing balance id', () => {
    const report = inspectWiseConfig({ ...VALID, balanceId: '' });
    expect(report.blocking).toContain('WISE_BALANCE_ID is not set');
  });

  it('blocks a missing iban', () => {
    const report = inspectWiseConfig({ ...VALID, iban: '' });
    expect(report.blocking.some((m) => m.includes('WISE_IBAN'))).toBe(true);
  });

  it('blocks a missing account holder name', () => {
    const report = inspectWiseConfig({ ...VALID, accountHolderName: '' });
    expect(report.blocking).toContain('WISE_ACCOUNT_HOLDER_NAME is not set');
  });

  it('blocks (not warns) a missing webhook public key in live — no shared default exists', () => {
    const report = inspectWiseConfig({ ...VALID, environment: 'live', webhookPublicKey: '' });
    expect(report.blocking.some((m) => m.includes('WISE_WEBHOOK_PUBLIC_KEY'))).toBe(true);
  });

  it('passes clean live config with everything set', () => {
    const report = inspectWiseConfig({ ...VALID, environment: 'live', webhookPublicKey: 'pem' });
    expect(report).toEqual({ environment: 'live', blocking: [], warnings: [] });
  });
});

describe('resolveWebhookPublicKey', () => {
  it('falls back to the published sandbox key when unset in sandbox', () => {
    const key = resolveWebhookPublicKey({ environment: 'sandbox', configured: '' });
    expect(key).toBe(WISE_SANDBOX_WEBHOOK_PUBLIC_KEY);
  });

  it('uses whatever is configured, even in sandbox', () => {
    const key = resolveWebhookPublicKey({ environment: 'sandbox', configured: 'custom-pem' });
    expect(key).toBe('custom-pem');
  });

  it('never throws in live with nothing configured — returns empty rather than crashing app boot', () => {
    // A missing live key is a `blocking` config problem (inspectWiseConfig), surfaced when checkout
    // or the webhook is actually used — not something that should take down every other route.
    const key = resolveWebhookPublicKey({ environment: 'live', configured: '' });
    expect(key).toBe('');
  });
});
