export type WiseEnvironmentName = 'live' | 'sandbox';

export interface WiseConfigReport {
  environment: WiseEnvironmentName;
  blocking: string[];
  warnings: string[];
}

// Wise's published sandbox webhook-signing public key (transferwise/digital-signatures-examples,
// verify-webhook-signature/verify-signature.js) — same key for every sandbox account, safe to
// ship as the sandbox default. There is no equivalent shared live key: WISE_WEBHOOK_PUBLIC_KEY
// must be set from the live account's webhook settings before going to production.
export const WISE_SANDBOX_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwpb91cEYuyJNQepZAVfP
ZIlPZfNUefH+n6w9SW3fykqKu938cR7WadQv87oF2VuT+fDt7kqeRziTmPSUhqPU
ys/V2Q1rlfJuXbE+Gga37t7zwd0egQ+KyOEHQOpcTwKmtZ81ieGHynAQzsn1We3j
wt760MsCPJ7GMT141ByQM+yW1Bx+4SG3IGjXWyqOWrcXsxAvIXkpUD/jK/L958Cg
nZEgz0BSEh0QxYLITnW1lLokSx/dTianWPFEhMC9BgijempgNXHNfcVirg1lPSyg
z7KqoKUN0oHqWLr2U1A+7kqrl6O2nx3CKs1bj1hToT1+p4kcMoHXA7kA+VBLUpEs
VwIDAQAB
-----END PUBLIC KEY-----
`;

export function inspectWiseConfig(input: {
  environment: string | undefined;
  apiToken: string;
  profileId: string;
  balanceId: string;
  iban: string;
  accountHolderName: string;
  webhookPublicKey: string;
}): WiseConfigReport {
  const environment: WiseEnvironmentName = input.environment === 'live' ? 'live' : 'sandbox';
  const blocking: string[] = [];
  const warnings: string[] = [];

  if (input.apiToken === '') blocking.push('WISE_API_TOKEN is not set');
  if (input.profileId === '') blocking.push('WISE_PROFILE_ID is not set');
  if (input.balanceId === '') blocking.push('WISE_BALANCE_ID is not set');
  if (input.iban === '')
    blocking.push('WISE_IBAN is not set — checkout would show no destination account');
  if (input.accountHolderName === '') blocking.push('WISE_ACCOUNT_HOLDER_NAME is not set');

  if (input.webhookPublicKey === '') {
    if (environment === 'live') {
      blocking.push(
        'WISE_WEBHOOK_PUBLIC_KEY is not set — no shared default exists for live, purchases could never be fulfilled',
      );
    } else {
      warnings.push('WISE_WEBHOOK_PUBLIC_KEY not set — falling back to the published sandbox key');
    }
  }

  return { environment, blocking, warnings };
}

export function resolveWebhookPublicKey(input: {
  environment: WiseEnvironmentName;
  configured: string;
}): string {
  if (input.configured !== '') return input.configured;
  if (input.environment === 'sandbox') return WISE_SANDBOX_WEBHOOK_PUBLIC_KEY;
  throw new Error('no Wise webhook public key available for the live environment');
}
