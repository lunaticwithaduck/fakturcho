export interface AeatVerifactuConfig {
  environment: 'test' | 'prod';
  clientCertPem: string;
  clientKeyPem: string;
  caPem: string | undefined;
  issuerNif: string;
  softwareNif: string;
  softwareName: string;
  softwareVersion: string;
  softwareAppId: string;
}

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.trim() !== '' ? value : undefined;
}

export function readAeatVerifactuConfig(
  env: NodeJS.ProcessEnv = process.env,
): AeatVerifactuConfig | null {
  const environment =
    env.AEAT_ENVIRONMENT === 'prod' ? 'prod' : env.AEAT_ENVIRONMENT === 'test' ? 'test' : null;
  const clientCertPem = nonEmpty(env.AEAT_CLIENT_CERT_PEM);
  const clientKeyPem = nonEmpty(env.AEAT_CLIENT_KEY_PEM);
  const issuerNif = nonEmpty(env.AEAT_ISSUER_NIF);
  const softwareNif = nonEmpty(env.AEAT_SOFTWARE_NIF);
  if (!environment || !clientCertPem || !clientKeyPem || !issuerNif || !softwareNif) return null;
  return {
    environment,
    clientCertPem,
    clientKeyPem,
    caPem: nonEmpty(env.AEAT_CA_PEM),
    issuerNif,
    softwareNif,
    softwareName: nonEmpty(env.AEAT_SOFTWARE_NAME) ?? 'Fakturcho',
    softwareVersion: nonEmpty(env.AEAT_SOFTWARE_VERSION) ?? '1.0',
    softwareAppId: nonEmpty(env.AEAT_SOFTWARE_APP_ID) ?? '01',
  };
}

export interface FaceConfig {
  environment: 'test' | 'prod';
  signingCertPem: string;
  signingKeyPem: string;
}

export function readFaceConfig(env: NodeJS.ProcessEnv = process.env): FaceConfig | null {
  const environment =
    env.FACE_ENVIRONMENT === 'prod' ? 'prod' : env.FACE_ENVIRONMENT === 'test' ? 'test' : null;
  const signingCertPem = nonEmpty(env.FACE_SIGNING_CERT_PEM);
  const signingKeyPem = nonEmpty(env.FACE_SIGNING_KEY_PEM);
  if (!environment || !signingCertPem || !signingKeyPem) return null;
  return { environment, signingCertPem, signingKeyPem };
}
