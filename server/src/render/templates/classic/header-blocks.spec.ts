import { describe, expect, it } from 'vitest';
import { buildDatesBlock, buildRecipientBlock } from './header-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildRecipientBlock — structured street/postcode/city address', () => {
  const locale = resolveClassicLocale('de', 'DE');

  it('prints street, postcode and city when there is no legacy free-text address', () => {
    const document = buildFakeDocument({
      recipientAddress: null,
      recipientStreet: 'Musterstraße 1',
      recipientPostcode: '10115',
      recipientCity: 'Berlin',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Musterstraße 1, 10115 Berlin');
  });

  it('still prints an unchanged legacy free-text address with no city on it', () => {
    const document = buildFakeDocument({
      recipientAddress: 'гр. Пловдив, бул. Свобода 5',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: null,
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('гр. Пловдив, бул. Свобода 5');
    expect(html).not.toContain('гр. Пловдив, бул. Свобода 5,');
  });

  it('appends the city to a free-text address line when both are set', () => {
    const document = buildFakeDocument({
      recipientAddress: 'ул. Тестова 1',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: 'София',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('ул. Тестова 1, София');
  });

  it('does not duplicate the city when the free-text address already contains it', () => {
    const document = buildFakeDocument({
      recipientAddress: 'ul. Marszałkowska 10, 00-590 Warszawa',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: 'Warszawa',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('ul. Marszałkowska 10, 00-590 Warszawa');
    expect(html).not.toContain('Warszawa, Warszawa');
  });

  it('does not duplicate a Cyrillic city already inside the free-text address', () => {
    const document = buildFakeDocument({
      recipientAddress: 'ул. „Раковски“ 55, гр. Варна',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: 'гр. Варна',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('ул. „Раковски“ 55, гр. Варна');
    expect(html).not.toContain('Варна, гр. Варна');
  });

  it('does not duplicate the city when it equals the recipient region (Dublin/Dublin)', () => {
    const document = buildFakeDocument({
      recipientAddress: 'D02 XY45 Dublin',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: 'Dublin',
      recipientCountyRegion: 'Dublin',
      recipientCountry: 'IE',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('D02 XY45 Dublin');
    expect(html).not.toContain('Dublin, Dublin');
  });
});

describe('buildDatesBlock — never a dash for a missing optional date', () => {
  it('hides the issue-date row on a draft (issuedAt null)', () => {
    const locale = resolveClassicLocale('es', 'ES');
    const document = buildFakeDocument({ issuedAt: null });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).not.toContain('—');
    expect(html).not.toContain('Fecha de expedición');
  });

  it('hides the valid-until row on a draft quote (validUntil null)', () => {
    const locale = resolveClassicLocale('fr', 'FR');
    const document = buildFakeDocument({ issuedAt: null, validUntil: null });
    const html = buildDatesBlock(document, 'quote', locale);
    expect(html).not.toContain('—');
  });

  it('hides the tax-event row on a draft (taxEventAt null)', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const document = buildFakeDocument({ taxEventAt: null });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).not.toContain('—');
    expect(html).not.toContain('Данъчно събитие');
  });

  it('hides the delivery-note date row when deliveryDate is null', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const document = buildFakeDocument({ deliveryDate: null });
    const html = buildDatesBlock(document, 'delivery_note', locale);
    expect(html).not.toContain('—');
    expect(html).not.toContain('Дата на доставка');
  });

  it('shows the delivery-note date row when deliveryDate is set', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const document = buildFakeDocument({ deliveryDate: new Date('2026-08-05') });
    const html = buildDatesBlock(document, 'delivery_note', locale);
    expect(html).toContain('Дата на доставка: 05.08.2026');
  });

  it('BG and DE print the tax-event date even when it equals the issue date', () => {
    for (const country of ['BG', 'DE'] as const) {
      const locale = resolveClassicLocale(country === 'BG' ? 'bg' : 'de', country);
      const document = buildFakeDocument({
        issuedAt: new Date('2026-08-02'),
        taxEventAt: new Date('2026-08-02'),
      });
      const html = buildDatesBlock(document, 'invoice', locale);
      expect(html.toLowerCase()).toMatch(/данъчно|leistungsdatum/);
    }
  });

  it('a generic EU country hides the tax-event row when it equals the issue date', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({
      issuedAt: new Date('2026-08-02'),
      taxEventAt: new Date('2026-08-02'),
    });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).not.toContain('Date of supply');
  });

  it('a generic EU country shows the tax-event row when it differs from the issue date', () => {
    const locale = resolveClassicLocale('en', 'IE');
    const document = buildFakeDocument({
      issuedAt: new Date('2026-08-02'),
      taxEventAt: new Date('2026-08-01'),
    });
    const html = buildDatesBlock(document, 'invoice', locale);
    expect(html).toContain('Date of supply: 01/08/2026');
  });
});
