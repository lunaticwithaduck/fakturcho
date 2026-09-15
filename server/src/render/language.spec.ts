import { describe, expect, it } from 'vitest';
import {
  resolveDocumentIssuerCountry,
  resolveDocumentLanguage,
  resolveEffectiveDocumentLanguage,
} from './language';

describe('resolveDocumentLanguage', () => {
  it('defaults to Bulgarian when nothing is set', () => {
    expect(resolveDocumentLanguage(null, null)).toBe('bg');
  });

  it('prefers an explicit documentLanguage over the issuer country', () => {
    expect(resolveDocumentLanguage('en', 'BG')).toBe('en');
    expect(resolveDocumentLanguage('bg', 'DE')).toBe('bg');
  });

  it('derives Bulgarian from a Bulgarian issuer country', () => {
    expect(resolveDocumentLanguage(null, 'BG')).toBe('bg');
  });

  it('derives the language from the issuer country', () => {
    expect(resolveDocumentLanguage(null, 'DE')).toBe('de');
    expect(resolveDocumentLanguage(null, 'FR')).toBe('fr');
    expect(resolveDocumentLanguage(null, 'NL')).toBe('en');
    expect(resolveDocumentLanguage(null, 'US')).toBe('en');
  });

  it('ignores an unrecognised documentLanguage value and falls back to the country', () => {
    expect(resolveDocumentLanguage('xx', 'BG')).toBe('bg');
    expect(resolveDocumentLanguage('xx', 'DE')).toBe('de');
  });
});

describe('resolveDocumentIssuerCountry', () => {
  it('always prefers the document snapshot when it is set', () => {
    expect(
      resolveDocumentIssuerCountry({ status: 'SENT', number: 1, issuerCountry: 'DE' }, 'RO'),
    ).toBe('DE');
    expect(
      resolveDocumentIssuerCountry({ status: 'DRAFT', number: null, issuerCountry: 'DE' }, 'RO'),
    ).toBe('DE');
  });

  it('falls back to the live issuer profile only for a draft with no snapshot yet', () => {
    expect(
      resolveDocumentIssuerCountry({ status: 'DRAFT', number: null, issuerCountry: null }, 'DE'),
    ).toBe('DE');
  });

  it('defaults a snapshot-less draft to bg when there is no live profile either', () => {
    expect(
      resolveDocumentIssuerCountry({ status: 'DRAFT', number: null, issuerCountry: null }, null),
    ).toBe('BG');
  });

  it('never joins the live issuer profile for an issued document, even with a null snapshot', () => {
    expect(
      resolveDocumentIssuerCountry({ status: 'SENT', number: 5, issuerCountry: null }, 'DE'),
    ).toBe('BG');
  });

  it('treats a null number as still a draft regardless of status', () => {
    expect(
      resolveDocumentIssuerCountry({ status: 'SENT', number: null, issuerCountry: null }, 'DE'),
    ).toBe('DE');
  });
});

describe('resolveEffectiveDocumentLanguage', () => {
  it('composes country resolution and language derivation for a draft', () => {
    expect(
      resolveEffectiveDocumentLanguage(
        { status: 'DRAFT', number: null, issuerCountry: null, documentLanguage: null },
        'DE',
      ),
    ).toBe('de');
  });

  it('composes country resolution and language derivation for a legacy issued document', () => {
    expect(
      resolveEffectiveDocumentLanguage(
        { status: 'SENT', number: 5, issuerCountry: null, documentLanguage: null },
        'DE',
      ),
    ).toBe('bg');
  });

  it('still prefers an explicit documentLanguage over any resolved country', () => {
    expect(
      resolveEffectiveDocumentLanguage(
        { status: 'DRAFT', number: null, issuerCountry: null, documentLanguage: 'en' },
        'BG',
      ),
    ).toBe('en');
  });
});
