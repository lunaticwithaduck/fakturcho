import { describe, expect, it } from 'vitest';
import { buildLineItemsTable } from './line-items';
import { resolveClassicLocale } from './locale';
import { buildFakeLineItems, buildFakeMixedLineItems } from './testing/fake-document';

describe('buildLineItemsTable — unit column', () => {
  it('omits the unit column for a non-PL issuer when no line has a unit', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const html = buildLineItemsTable(buildFakeLineItems(), locale, 'invoice');
    expect(html).not.toContain('Einheit');
  });

  it('shows the unit column when a line carries a unit code', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const html = buildLineItemsTable(buildFakeLineItems({ unitCode: 'HUR' }), locale, 'invoice');
    expect(html).toContain('Einheit');
    expect(html).toContain('>Std.<');
  });

  it('prints a dash for a line with no unit once the column is shown', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const lineItems = [
      ...buildFakeLineItems({ id: 'li_1', unitCode: 'HUR' }),
      ...buildFakeLineItems({ id: 'li_2', unitCode: null }),
    ];
    const html = buildLineItemsTable(lineItems, locale, 'invoice');
    expect(html).toContain('>—<');
  });

  it('always shows the unit column for a PL issuer on a tax document, dash when unset', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const html = buildLineItemsTable(buildFakeLineItems({ unitCode: null }), locale, 'invoice');
    expect(html).toContain('Miara');
    expect(html).toContain('>—<');
  });

  it('does not force the unit column for a PL quote (not a tax document)', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const html = buildLineItemsTable(buildFakeLineItems({ unitCode: null }), locale, 'quote');
    expect(html).not.toContain('Miara');
  });
});

describe('buildLineItemsTable — VAT rate column', () => {
  it('omits the VAT rate column for a single-rate non-PL document', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const html = buildLineItemsTable(buildFakeLineItems(), locale, 'invoice');
    expect(html).not.toContain('USt.-Satz');
  });

  it('shows the VAT rate column when lines carry different rates', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const html = buildLineItemsTable(buildFakeMixedLineItems(), locale, 'invoice');
    expect(html).toContain('USt.-Satz');
    expect(html).toContain('>20%<');
    expect(html).toContain('>—<');
  });

  it('always shows the VAT rate column for a PL issuer and prints "np." on a reverse-charged line', () => {
    const locale = resolveClassicLocale('pl', 'PL');
    const html = buildLineItemsTable(buildFakeMixedLineItems(), locale, 'invoice');
    expect(html).toContain('Stawka VAT');
    expect(html).toContain('>np.<');
    expect(html).toContain('>20%<');
  });

  it('prints 0% for a zero-rated line that is not reverse-charged', () => {
    const locale = resolveClassicLocale('bg', 'BG');
    const lineItems = [
      ...buildFakeLineItems({ id: 'li_1', vatRateBp: 2000, vatCategory: 'S' }),
      ...buildFakeLineItems({ id: 'li_2', vatRateBp: 0, vatCategory: 'Z' }),
    ];
    const html = buildLineItemsTable(lineItems, locale, 'invoice');
    expect(html).toContain('>0%<');
  });
});
