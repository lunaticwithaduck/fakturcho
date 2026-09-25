import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { buildRecipientBlock } from './header-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('issuer address county/province printing', () => {
  it('IT: folds the province into the city as "City (XX)"', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Via Roma 1',
      issuerPostcode: '00186',
      issuerCity: 'Roma',
      issuerCountyRegion: 'RM',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Via Roma 1, 00186 Roma (RM)');
  });

  it('RO: appends ", jud. <county>" to the whole address', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Str. Exemplu 1',
      issuerPostcode: '300001',
      issuerCity: 'Timișoara',
      issuerCountyRegion: 'Timiș',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Str. Exemplu 1, 300001 Timișoara, jud. Timiș');
  });

  it('ES: appends ", <provincia>" only when it differs from the city', () => {
    const locale = resolveClassicLocale('es', 'ES');
    const differing = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Calle Mayor 1',
      issuerPostcode: '28001',
      issuerCity: 'Madrid',
      issuerCountyRegion: 'Guadalajara',
    });
    expect(buildIssuerBlock(differing, 'invoice', locale)).toContain(
      'Calle Mayor 1, 28001 Madrid, Guadalajara',
    );

    const same = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Calle Mayor 1',
      issuerPostcode: '28001',
      issuerCity: 'Madrid',
      issuerCountyRegion: 'Madrid',
    });
    const html = buildIssuerBlock(same, 'invoice', locale);
    expect(html).toContain('Calle Mayor 1, 28001 Madrid');
    expect(html).not.toContain('Madrid, Madrid');
  });

  it('other countries print the address unchanged even with a countyRegion set', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Musterstraße 1',
      issuerPostcode: '10115',
      issuerCity: 'Berlin',
      issuerCountyRegion: 'Berlin',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Musterstraße 1, 10115 Berlin<');
  });
});

describe('recipient address county/province printing decides by recipientCountry', () => {
  it('IT recipient: folds the province into the city', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({
      recipientAddress: null,
      recipientStreet: 'Via Roma 1',
      recipientPostcode: '00186',
      recipientCity: 'Roma',
      recipientCountyRegion: 'RM',
      recipientCountry: 'IT',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Via Roma 1, 00186 Roma (RM)');
  });

  it('RO recipient: appends ", jud. <county>"', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({
      recipientAddress: null,
      recipientStreet: 'Str. Exemplu 1',
      recipientPostcode: '300001',
      recipientCity: 'Timișoara',
      recipientCountyRegion: 'Timiș',
      recipientCountry: 'RO',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Str. Exemplu 1, 300001 Timișoara, jud. Timiș');
  });

  it('a DE recipient on an IT-issuer document is unaffected (decided by recipientCountry, not issuer)', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({
      recipientAddress: null,
      recipientStreet: 'Musterstraße 1',
      recipientPostcode: '10115',
      recipientCity: 'Berlin',
      recipientCountyRegion: 'Berlin',
      recipientCountry: 'DE',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Musterstraße 1, 10115 Berlin, Germania<');
  });
});
