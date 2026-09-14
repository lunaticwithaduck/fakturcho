import { describe, expect, it } from 'vitest';
import { buildRecipientBlock } from './header-blocks';
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
    const html = buildRecipientBlock(document, locale);
    expect(html).toContain('Musterstraße 1, 10115 Berlin');
  });

  it('still prints an unchanged legacy free-text address with no city on it', () => {
    const document = buildFakeDocument({
      recipientAddress: 'гр. Пловдив, бул. Свобода 5',
      recipientStreet: null,
      recipientPostcode: null,
      recipientCity: null,
    });
    const html = buildRecipientBlock(document, locale);
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
    const html = buildRecipientBlock(document, locale);
    expect(html).toContain('ул. Тестова 1, София');
  });
});
