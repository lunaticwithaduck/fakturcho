export type WiseEnvironmentName = 'live' | 'sandbox';

export interface WiseConfigReport {
  environment: WiseEnvironmentName;
  blocking: string[];
  warnings: string[];
}

// Wise's published webhook-signing public keys (docs.wise.com/guides/developer/webhooks/event-handling
// — "Production public key" / "Sandbox public key"). Fixed per environment, same for every account
// regardless of personal vs business, so both are safe to ship as defaults.
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

export const WISE_PRODUCTION_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg6Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
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
    warnings.push(
      `WISE_WEBHOOK_PUBLIC_KEY not set — falling back to the published ${environment} key`,
    );
  }

  return { environment, blocking, warnings };
}

export function resolveWebhookPublicKey(input: {
  environment: WiseEnvironmentName;
  configured: string;
}): string {
  if (input.configured !== '') return input.configured;
  return input.environment === 'live'
    ? WISE_PRODUCTION_WEBHOOK_PUBLIC_KEY
    : WISE_SANDBOX_WEBHOOK_PUBLIC_KEY;
}
