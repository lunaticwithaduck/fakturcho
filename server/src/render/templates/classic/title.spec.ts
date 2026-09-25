import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildTitle } from './title';

describe('buildTitle — number sign and draft title per language', () => {
  const cases: Array<{ language: 'bg' | 'en' | 'de' | 'fr' | 'it' | 'pl' | 'ro' | 'es' }> = [
    { language: 'bg' },
    { language: 'en' },
    { language: 'de' },
    { language: 'fr' },
    { language: 'it' },
    { language: 'pl' },
    { language: 'ro' },
    { language: 'es' },
  ];

  const expectedSign: Record<string, string> = {
    bg: '№',
    en: 'no.',
    de: 'Nr.',
    fr: 'n°',
    it: 'n.',
    pl: 'nr',
    ro: 'nr.',
    es: 'n.º',
  };

  const expectedDraft: Record<string, string> = {
    bg: 'Фактура – чернова',
    en: 'Invoice (draft)',
    de: 'Rechnung (Entwurf)',
    fr: 'Facture (brouillon)',
    it: 'Bozza di fattura',
    pl: 'Faktura – wersja robocza',
    ro: 'Factură – ciornă',
    es: 'Factura (borrador)',
  };

  for (const { language } of cases) {
    it(`prints the ${language} number sign between the label and the number`, () => {
      const locale = resolveClassicLocale(language, language === 'bg' ? 'BG' : undefined);
      const html = buildTitle('invoice', null, 1, null, locale);
      expect(html).toContain(expectedSign[language]);
      expect(html).not.toContain(' # ');
    });

    it(`renders the ${language} draft title without a number sign`, () => {
      const locale = resolveClassicLocale(language, language === 'bg' ? 'BG' : undefined);
      const html = buildTitle('invoice', null, null, null, locale);
      expect(html).toBe(expectedDraft[language]);
    });
  }
});
