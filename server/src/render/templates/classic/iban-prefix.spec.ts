import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import type { ClassicLanguage } from './labels';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('the IBAN row is labelled, grouped in fours and keeps the no-break class', () => {
  const languages: ClassicLanguage[] = ['bg', 'en', 'de', 'fr', 'it', 'pl', 'ro', 'es'];

  for (const language of languages) {
    it(`prints IBAN: <value> for ${language}`, () => {
      const locale = resolveClassicLocale(language, language === 'bg' ? 'BG' : undefined);
      const document = buildFakeDocument({ issuerIban: 'BG80BNBG96611020345678' });
      const html = buildIssuerBlock(document, 'invoice', locale);
      const prefix = language === 'fr' ? 'IBAN : ' : 'IBAN: ';
      expect(html).toContain(`<div class="no-break">${prefix}BG80 BNBG 9661 1020 3456 78</div>`);
    });
  }
});
