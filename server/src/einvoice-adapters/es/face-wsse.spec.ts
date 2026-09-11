import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildConsultarFacturaEnvelope } from './face-envelope';
import { signFaceEnvelope, verifyFaceEnvelopeSignature } from './face-wsse';

let certPem: string;
let keyPem: string;
let workdir: string;

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), 'face-wsse-test-'));
  const keyPath = join(workdir, 'key.pem');
  const certPath = join(workdir, 'cert.pem');
  execFileSync('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-days',
    '1',
    '-nodes',
    '-subj',
    '/CN=fakturcho-test',
  ]);
  keyPem = readFileSync(keyPath, 'utf8');
  certPem = readFileSync(certPath, 'utf8');
});

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

describe('signFaceEnvelope', () => {
  it('produces a WS-Security X.509 header carrying a BinarySecurityToken and a Signature', () => {
    const envelope = buildConsultarFacturaEnvelope('O00001301_13_00000142');
    const signed = signFaceEnvelope(envelope, certPem, keyPem);

    expect(signed).toContain('<wsse:BinarySecurityToken');
    expect(signed).toContain(
      'ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"',
    );
    expect(signed).toContain('<ds:Signature');
    expect(signed).toContain(
      '<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"',
    );
    expect(signed).toContain(
      '<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"',
    );
    expect(signed).toContain('<wsse:SecurityTokenReference');
  });

  it('signs a payload that xml-crypto itself verifies as valid against the signing certificate', () => {
    const envelope = buildConsultarFacturaEnvelope('O00001301_13_00000142');
    const signed = signFaceEnvelope(envelope, certPem, keyPem);

    expect(verifyFaceEnvelopeSignature(signed, certPem)).toBe(true);
  });

  it('fails verification once the signed Body content is tampered with', () => {
    const envelope = buildConsultarFacturaEnvelope('O00001301_13_00000142');
    const signed = signFaceEnvelope(envelope, certPem, keyPem);
    const tampered = signed.replace('O00001301_13_00000142', 'O00001301_13_99999999');

    expect(verifyFaceEnvelopeSignature(tampered, certPem)).toBe(false);
  });

  it('fails verification against a different certificate', () => {
    const otherKeyPath = join(workdir, 'other-key.pem');
    const otherCertPath = join(workdir, 'other-cert.pem');
    execFileSync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      otherKeyPath,
      '-out',
      otherCertPath,
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=someone-else',
    ]);
    const otherCertPem = readFileSync(otherCertPath, 'utf8');

    const envelope = buildConsultarFacturaEnvelope('O00001301_13_00000142');
    const signed = signFaceEnvelope(envelope, certPem, keyPem);

    expect(verifyFaceEnvelopeSignature(signed, otherCertPem)).toBe(false);
  });

  it('rejects an envelope that has no empty Header placeholder to sign into', () => {
    expect(() =>
      signFaceEnvelope('<soapenv:Envelope><soapenv:Body/></soapenv:Envelope>', certPem, keyPem),
    ).toThrow();
  });
});
