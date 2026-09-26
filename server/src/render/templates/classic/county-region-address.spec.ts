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

  it('RO: prints nothing extra for București since city already says it (never repeat the city)', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Str. Exemplu 1',
      issuerPostcode: '010101',
      issuerCity: 'București',
      issuerCountyRegion: 'București',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Str. Exemplu 1, 010101 București<');
    expect(html).not.toContain('jud. București');
    expect(html).not.toContain('București, București');
  });

  it('RO: labels București "Municipiul", never "jud.", when the county differs from the city (e.g. a sector)', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Str. Exemplu 1',
      issuerPostcode: '010101',
      issuerCity: 'Sector 1',
      issuerCountyRegion: 'București',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Str. Exemplu 1, 010101 Sector 1, Municipiul București');
    expect(html).not.toContain('jud. București');
  });

  it('RO: matches București case- and diacritic-insensitively', () => {
    const locale = resolveClassicLocale('ro', 'RO');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Str. Exemplu 1',
      issuerPostcode: '010101',
      issuerCity: 'Bucuresti',
      issuerCountyRegion: 'BUCUREȘTI',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('jud.');
    expect(html).not.toContain('Municipiul');
  });

  it('IT: prints the plain city, no parenthetical repeat, when the province name equals the city', () => {
    const locale = resolveClassicLocale('it', 'IT');
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Via Roma 1',
      issuerPostcode: '00100',
      issuerCity: 'Roma',
      issuerCountyRegion: 'Roma',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Via Roma 1, 00100 Roma<');
    expect(html).not.toContain('Roma (Roma)');
  });

  it('does not duplicate the city when the free-text issuer address line already contains it', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const document = buildFakeDocument({
      issuerAddressLine: 'ул. „Раковски“ 55, гр. Варна',
      issuerStreet: null,
      issuerPostcode: null,
      issuerCity: 'гр. Варна',
      issuerCountyRegion: null,
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('ул. „Раковски“ 55, гр. Варна');
    expect(html).not.toContain('Варна, гр. Варна');
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
