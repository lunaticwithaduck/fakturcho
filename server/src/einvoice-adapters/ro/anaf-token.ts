const TOKEN_URL = 'https://logincert.anaf.ro/anaf-oauth2/v1/token';

export interface AnafOAuthConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export class AnafTokenCache {
  private token: CachedToken | null = null;

  constructor(private readonly config: AnafOAuthConfig) {}

  invalidate(): void {
    this.token = null;
  }

  async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token.accessToken;
    }
    return this.refresh();
  }

  private async refresh(): Promise<string> {
    const basicAuth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
      'base64',
    );
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
    });

    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
    } catch (error) {
      throw new Error(`ANAF token refresh request failed: ${(error as Error).message}`);
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `ANAF token refresh rejected: ${response.status} ${response.statusText} — ${text}`,
      );
    }

    const parsed = JSON.parse(text) as { access_token?: string; expires_in?: number };
    if (!parsed.access_token) {
      throw new Error(`ANAF token refresh response had no access_token: ${text}`);
    }

    this.token = {
      accessToken: parsed.access_token,
      expiresAt: Date.now() + (parsed.expires_in ?? 60) * 1000 - 5_000,
    };
    return this.token.accessToken;
  }
}
