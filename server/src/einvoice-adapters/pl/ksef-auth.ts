import { ksefRequest } from './ksef-client';
import { fetchPublicKeyCertificate, rsaOaepEncrypt } from './ksef-crypto';
import { normalizeNip } from './nip';

export interface AccessTokenState {
  accessToken: string;
  accessTokenValidUntil: number;
  refreshToken: string;
  refreshTokenValidUntil: number;
}

interface StatusInfo {
  code: number;
  description: string;
  details?: string[] | null;
}

// https://github.com/CIRFMF/ksef-api/blob/main/uwierzytelnianie.md
export async function authenticateWithKsefToken(
  baseUrl: string,
  nip: string,
  ksefToken: string,
): Promise<AccessTokenState> {
  const challenge = await ksefRequest<{ challenge: string; timestampMs: number }>(
    baseUrl,
    'POST',
    '/auth/challenge',
  );

  const tokenCert = await fetchPublicKeyCertificate(baseUrl, 'KsefTokenEncryption');
  const encryptedToken = rsaOaepEncrypt(
    Buffer.from(`${ksefToken}|${challenge.timestampMs}`, 'utf8'),
    tokenCert,
  ).toString('base64');

  const init = await ksefRequest<{
    referenceNumber: string;
    authenticationToken: { token: string };
  }>(baseUrl, 'POST', '/auth/ksef-token', {
    body: {
      challenge: challenge.challenge,
      contextIdentifier: { type: 'Nip', value: normalizeNip(nip) },
      encryptedToken,
    },
  });

  await pollAuthenticationStatus(baseUrl, init.referenceNumber, init.authenticationToken.token);

  const tokens = await ksefRequest<{
    accessToken: { token: string; validUntil: string };
    refreshToken: { token: string; validUntil: string };
  }>(baseUrl, 'POST', '/auth/token/redeem', { accessToken: init.authenticationToken.token });

  return {
    accessToken: tokens.accessToken.token,
    accessTokenValidUntil: new Date(tokens.accessToken.validUntil).getTime(),
    refreshToken: tokens.refreshToken.token,
    refreshTokenValidUntil: new Date(tokens.refreshToken.validUntil).getTime(),
  };
}

export async function refreshAccessToken(
  baseUrl: string,
  refreshToken: string,
): Promise<{ accessToken: string; accessTokenValidUntil: number }> {
  const refreshed = await ksefRequest<{ accessToken: { token: string; validUntil: string } }>(
    baseUrl,
    'POST',
    '/auth/token/refresh',
    { accessToken: refreshToken },
  );
  return {
    accessToken: refreshed.accessToken.token,
    accessTokenValidUntil: new Date(refreshed.accessToken.validUntil).getTime(),
  };
}

async function pollAuthenticationStatus(
  baseUrl: string,
  referenceNumber: string,
  authenticationToken: string,
): Promise<void> {
  const deadline = Date.now() + 60_000;
  for (;;) {
    const status = await ksefRequest<{ status: StatusInfo }>(
      baseUrl,
      'GET',
      `/auth/${referenceNumber}`,
      {
        accessToken: authenticationToken,
      },
    );
    if (status.status.code === 200) return;
    if (status.status.code !== 100) {
      throw new Error(
        `KSeF authentication failed: ${status.status.code} ${status.status.description}`,
      );
    }
    if (Date.now() > deadline) {
      throw new Error('KSeF authentication timed out while status stayed "authenticating"');
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
