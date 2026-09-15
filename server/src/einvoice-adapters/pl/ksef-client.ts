export type KsefEnvironment = 'test' | 'demo' | 'prod';

const API_BASES: Record<KsefEnvironment, string> = {
  test: 'https://api-test.ksef.mf.gov.pl/v2',
  demo: 'https://api-demo.ksef.mf.gov.pl/v2',
  prod: 'https://api.ksef.mf.gov.pl/v2',
};

export function resolveEnvironment(raw: string | undefined): KsefEnvironment | null {
  return raw === 'test' || raw === 'demo' || raw === 'prod' ? raw : null;
}

export function apiBase(environment: KsefEnvironment): string {
  return API_BASES[environment];
}

export async function ksefRequest<T>(
  baseUrl: string,
  method: 'GET' | 'POST',
  path: string,
  options: { accessToken?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;

  const init: RequestInit = { method, headers };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const res = await fetch(`${baseUrl}${path}`, init);

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(`KSeF ${method} ${path} failed: HTTP ${res.status} ${responseText}`);
  }
  if (!responseText) return undefined as T;
  return JSON.parse(responseText) as T;
}
