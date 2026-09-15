import { X509Certificate } from 'node:crypto';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';
import * as xpath from 'xpath';

// FACe requires WS-Security 1.0 X.509 Token Profile: a wsse:BinarySecurityToken
// carrying the signing certificate, and an enveloped ds:Signature over the SOAP Body
// whose KeyInfo points back at that token via a wsse:SecurityTokenReference. See
// AEAT.md for the worked example this mirrors (FACe's own SARCF integration guide).
const WSSE_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const WSU_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
const X509_VALUE_TYPE =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3';
const BASE64_ENCODING_TYPE =
  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary';

const EMPTY_HEADER = '<soapenv:Header></soapenv:Header>';

function certToDerBase64(certPem: string): string {
  return new X509Certificate(certPem).raw.toString('base64');
}

// The envelope this signs must carry a literal, non-self-closing `<soapenv:Header>`
// placeholder (see face-envelope.ts) so the wsse:Security block can be inserted by a
// plain string replace rather than a general-purpose XML mutation.
export function signFaceEnvelope(envelopeXml: string, certPem: string, keyPem: string): string {
  if (!envelopeXml.includes(EMPTY_HEADER)) {
    throw new Error('signFaceEnvelope: envelope is missing the expected empty <soapenv:Header>');
  }

  const certId = `CertId-${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
  const binarySecurityToken =
    `<wsse:BinarySecurityToken xmlns:wsse="${WSSE_NS}" xmlns:wsu="${WSU_NS}" ` +
    `EncodingType="${BASE64_ENCODING_TYPE}" ValueType="${X509_VALUE_TYPE}" wsu:Id="${certId}">` +
    `${certToDerBase64(certPem)}</wsse:BinarySecurityToken>`;
  const securityHeader = `<wsse:Security xmlns:wsse="${WSSE_NS}" soapenv:mustUnderstand="1">${binarySecurityToken}</wsse:Security>`;
  const withSecurityHeader = envelopeXml.replace(
    EMPTY_HEADER,
    `<soapenv:Header>${securityHeader}</soapenv:Header>`,
  );

  const sig = new SignedXml({
    idMode: 'wssecurity',
    privateKey: keyPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
  });
  sig.addReference({
    xpath: "//*[local-name(.)='Body']",
    transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
  });
  sig.getKeyInfoContent = () =>
    `<wsse:SecurityTokenReference xmlns:wsse="${WSSE_NS}" xmlns:wsu="${WSU_NS}" wsu:Id="STRId-${certId}">` +
    `<wsse:Reference URI="#${certId}" ValueType="${X509_VALUE_TYPE}"/></wsse:SecurityTokenReference>`;

  sig.computeSignature(withSecurityHeader, {
    prefix: 'ds',
    location: { reference: "//*[local-name(.)='Security']", action: 'append' },
  });

  return sig.getSignedXml();
}

export function verifyFaceEnvelopeSignature(signedEnvelopeXml: string, certPem: string): boolean {
  const doc = new DOMParser().parseFromString(signedEnvelopeXml, 'text/xml');
  const nodes = xpath.select(
    "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
    doc,
  );
  const signatureNode = Array.isArray(nodes) ? nodes[0] : undefined;
  if (!signatureNode) return false;

  const sig = new SignedXml({ idMode: 'wssecurity', publicCert: certPem });
  sig.loadSignature(signatureNode as unknown as Node);
  try {
    return sig.checkSignature(signedEnvelopeXml);
  } catch {
    return false;
  }
}
