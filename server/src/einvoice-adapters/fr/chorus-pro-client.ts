export type ChorusProEnvironment = 'sandbox' | 'prod';

const OAUTH_TOKEN_URL: Record<ChorusProEnvironment, string> = {
  sandbox: 'https://sandbox-oauth.piste.gouv.fr/api/oauth/token',
  prod: 'https://oauth.piste.gouv.fr/api/oauth/token',
};

const FACTURES_API_BASE_URL: Record<ChorusProEnvironment, string> = {
  sandbox: 'https://sandbox-api.piste.gouv.fr/cpro/factures/v1',
  prod: 'https://api.piste.gouv.fr/cpro/factures/v1',
};

interface PisteTokenResponse {
  access_token: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

function readEnv(name: string): string {
  return process.env[name] ?? '';
}

function readEnvironment(): ChorusProEnvironment | null {
  const value = process.env.CHORUSPRO_ENVIRONMENT;
  return value === 'sandbox' || value === 'prod' ? value : null;
}

export class ChorusProApiClient {
  private cachedToken: CachedToken | null = null;

  isConfigured(): boolean {
    return (
      readEnvironment() !== null &&
      readEnv('CHORUSPRO_CLIENT_ID') !== '' &&
      readEnv('CHORUSPRO_CLIENT_SECRET') !== '' &&
      readEnv('CHORUSPRO_TECH_LOGIN') !== '' &&
      readEnv('CHORUSPRO_TECH_PASSWORD') !== ''
    );
  }

  async post(path: string, body: unknown): Promise<Response> {
    const first = await this.postJson(path, body, await this.getAccessToken());
    if (first.status !== 401) return first;

    this.cachedToken = null;
    return this.postJson(path, body, await this.getAccessToken());
  }

  private async postJson(path: string, body: unknown, accessToken: string): Promise<Response> {
    const response = await fetch(`${FACTURES_API_BASE_URL[this.requireEnvironment()]}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'cpro-account': this.cproAccountHeader(),
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(body),
    });

    if (response.status >= 500) {
      throw new Error(`Chorus Pro API error (HTTP ${response.status}): ${await response.text()}`);
    }

    return response;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken !== null && this.cachedToken.expiresAtMs > now) {
      return this.cachedToken.accessToken;
    }

    const response = await fetch(OAUTH_TOKEN_URL[this.requireEnvironment()], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: readEnv('CHORUSPRO_CLIENT_ID'),
        client_secret: readEnv('CHORUSPRO_CLIENT_SECRET'),
        scope: 'openid',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Chorus Pro OAuth token request failed (HTTP ${response.status}): ${await response.text()}`,
      );
    }

    const token = (await response.json()) as PisteTokenResponse;
    this.cachedToken = {
      accessToken: token.access_token,
      // renew a little early rather than racing an expiry mid-request
      expiresAtMs: now + (token.expires_in - 30) * 1000,
    };
    return this.cachedToken.accessToken;
  }

  private cproAccountHeader(): string {
    const login = readEnv('CHORUSPRO_TECH_LOGIN');
    const password = readEnv('CHORUSPRO_TECH_PASSWORD');
    return Buffer.from(`${login}:${password}`, 'utf8').toString('base64');
  }

  private requireEnvironment(): ChorusProEnvironment {
    const environment = readEnvironment();
    if (environment === null) {
      throw new Error('CHORUSPRO_ENVIRONMENT must be "sandbox" or "prod"');
    }
    return environment;
  }
}
