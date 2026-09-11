import { constants, publicEncrypt, X509Certificate } from 'node:crypto';
import { ksefRequest } from './ksef-client';

export interface PublicKeyCertificate {
  certificate: string;
  usage: string[];
  validFrom: string;
  validTo: string;
}

export type PublicKeyUsage = 'KsefTokenEncryption' | 'SymmetricKeyEncryption';

// RSA-OAEP with SHA-256 hash and MGF1-SHA256, per EncryptionInfo in the
// published KSeF 2.0 OpenAPI schema — see KSEF.md.
export function rsaOaepEncrypt(data: Buffer, certificate: PublicKeyCertificate): Buffer {
  const cert = new X509Certificate(Buffer.from(certificate.certificate, 'base64'));
  return publicEncrypt(
    { key: cert.publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    data,
  );
}

export async function fetchPublicKeyCertificate(
  baseUrl: string,
  usage: PublicKeyUsage,
): Promise<PublicKeyCertificate> {
  const certificates = await ksefRequest<PublicKeyCertificate[]>(
    baseUrl,
    'GET',
    '/security/public-key-certificates',
  );
  const now = Date.now();
  const candidate = certificates.find(
    (cert) =>
      cert.usage.includes(usage) &&
      new Date(cert.validFrom).getTime() <= now &&
      now <= new Date(cert.validTo).getTime(),
  );
  if (!candidate) throw new Error(`no valid KSeF public key certificate for usage ${usage}`);
  return candidate;
}
