export type RevolutEnvironmentName = 'production' | 'sandbox';

export interface RevolutConfigReport {
  environment: RevolutEnvironmentName;
  baseUrl: string;
  blocking: string[];
  warnings: string[];
}

const PRODUCTION_BASE_URL = 'https://merchant.revolut.com/api';
const SANDBOX_BASE_URL = 'https://sandbox-merchant.revolut.com/api';

export function inspectRevolutConfig(input: {
  environment: string | undefined;
  apiKey: string;
  webhookSecret: string;
}): RevolutConfigReport {
  const environment: RevolutEnvironmentName =
    input.environment === 'production' ? 'production' : 'sandbox';
  const blocking: string[] = [];
  const warnings: string[] = [];

  if (input.apiKey === '') {
    blocking.push('REVOLUT_API_KEY is not set');
  } else if (!input.apiKey.startsWith('sk_')) {
    blocking.push('REVOLUT_API_KEY is not a secret key (expected an sk_ prefix)');
  }

  if (input.webhookSecret === '') {
    warnings.push('REVOLUT_WEBHOOK_SECRET is not set — purchases will never be fulfilled');
  }

  return {
    environment,
    baseUrl: environment === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL,
    blocking,
    warnings,
  };
}
