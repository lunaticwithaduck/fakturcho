import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { plDomesticStandardInvoice } from './__fixtures__/pl-domestic-standard';
import { toFa3Xml } from './fa3-mapper';
import { buildKodIUrl, hashFa3Xml } from './ksef-qr';

describe('hashFa3Xml', () => {
  it('matches a hand-computed SHA-256 digest, base64url-encoded', () => {
    // sha256("<Faktura>test</Faktura>") = 80:0a:91:4e:a1:46:a0:1b:26:...,
    // computed independently with `openssl dgst -sha256 -binary | base64`
    // then re-encoded base64 -> base64url (+/ -> -_, padding dropped).
    expect(hashFa3Xml('<Faktura>test</Faktura>')).toBe(
      'gAqRTqFGoBsmAhD1u8qumMF2bvgyavkNv2nlczKxu0o',
    );
  });

  it('is base64url, never base64 (+/= are illegal in a URL path segment)', () => {
    const hash = hashFa3Xml('anything at all, repeated '.repeat(20));
    expect(hash).not.toMatch(/[+/=]/);
  });
});

describe('buildKodIUrl — KSeF 2.0 "KOD I" (CIRFMF/ksef-api kody-qr.md)', () => {
  it('builds https://qr.ksef.mf.gov.pl/invoice/{NIP}/{DD-MM-RRRR}/{hash of the FA(3) file}', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    const expectedHash = createHash('sha256').update(xml, 'utf8').digest('base64url');

    const url = buildKodIUrl(plDomesticStandardInvoice, xml);

    expect(url).toBe(`https://qr.ksef.mf.gov.pl/invoice/1234563218/05-09-2026/${expectedHash}`);
  });

  it('changes the hash segment when the XML content changes', () => {
    const xml = toFa3Xml(plDomesticStandardInvoice);
    const url = buildKodIUrl(plDomesticStandardInvoice, xml);
    const otherUrl = buildKodIUrl(plDomesticStandardInvoice, `${xml} `);

    expect(url).not.toBe(otherUrl);
  });

  it('falls back to the VAT number, stripped of the PL prefix, when eik is absent', () => {
    const document = {
      ...plDomesticStandardInvoice,
      issuer: { ...plDomesticStandardInvoice.issuer, eik: null },
    };
    const xml = toFa3Xml(document);

    expect(buildKodIUrl(document, xml)).toContain('/invoice/1234563218/');
  });
});
