export type PaddleEnvironmentName = 'production' | 'sandbox';

export interface PaddleConfigReport {
  environment: PaddleEnvironmentName;
  blocking: string[];
  warnings: string[];
}

const LIVE_KEY_PREFIX = 'pdl_live_';
const SANDBOX_KEY_PREFIX = 'pdl_sdbx_';

export function inspectPaddleConfig(input: {
  environment: string | undefined;
  apiKey: string;
  webhookSecret: string;
}): PaddleConfigReport {
  const environment: PaddleEnvironmentName =
    input.environment === 'production' ? 'production' : 'sandbox';
  const blocking: string[] = [];
  const warnings: string[] = [];

  if (input.apiKey === '') {
    blocking.push('PADDLE_API_KEY is not set');
  } else if (environment === 'production' && input.apiKey.startsWith(SANDBOX_KEY_PREFIX)) {
    blocking.push('PADDLE_ENVIRONMENT is production but PADDLE_API_KEY is a sandbox key');
  } else if (environment === 'sandbox' && input.apiKey.startsWith(LIVE_KEY_PREFIX)) {
    blocking.push('PADDLE_ENVIRONMENT is sandbox but PADDLE_API_KEY is a live key');
  }

  if (input.webhookSecret === '') {
    warnings.push('PADDLE_WEBHOOK_SECRET is not set — purchases will never be fulfilled');
  }

  return { environment, blocking, warnings };
}
