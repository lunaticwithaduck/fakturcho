import { describe, expect, it } from 'vitest';
import { buildLineItemsTable } from './line-items';
import { resolveClassicLocale } from './locale';
import { buildFakeLineItems } from './testing/fake-document';

// A reviewer saw "1.5" printed on a Polish document — every language must use
// its own locale decimal separator for a fractional quantity, not just bg.
describe('a fractional quantity uses the locale decimal separator in every language', () => {
  const cases: Array<[string, string]> = [
    ['bg', '2,5'],
    ['en', '2.5'],
    ['de', '2,5'],
    ['fr', '2,5'],
    ['it', '2,5'],
    ['pl', '2,5'],
    ['ro', '2,5'],
    ['es', '2,5'],
  ];

  for (const [language, expected] of cases) {
    it(`prints ${expected} for ${language}`, () => {
      const locale = resolveClassicLocale(language as never, language === 'bg' ? 'BG' : undefined);
      const html = buildLineItemsTable(buildFakeLineItems({ quantity: '2.5' }), locale, 'invoice');
      expect(html).toContain(`<td>${expected}</td>`);
    });
  }
});
