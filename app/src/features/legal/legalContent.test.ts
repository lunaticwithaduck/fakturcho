import { describe, expect, it } from 'vitest';
import { COMPANY } from './company';
import { getLegalDoc, getLegalFooterLinks } from './legalContent';

describe('getLegalDoc', () => {
  it('renders the Bulgarian terms intro unchanged', () => {
    const doc = getLegalDoc('terms', 'bg');
    expect(doc.intro).toBe(
      `Тези общи условия уреждат отношенията между ${COMPANY.legalName} и всяко лице, което използва уеб приложението ${COMPANY.productName} на адрес ${COMPANY.website}. С регистрацията на акаунт потребителят приема условията в този документ.`,
    );
    expect(doc.sections[0]?.paragraphs[0]).toBe(
      'Услугата се предоставя от „Пачелиев Консултинг“ ЕООД, ЕИК 208697044, гр. София 1324, р-н Люлин, жк. Люлин, бл. 715, вх. Б, ет. 1, ап. 21.',
    );
    expect(doc.lastUpdatedLabel).toBe(`Последна актуализация: ${COMPANY.lastUpdated}`);
  });

  it('renders English terms with the Bulgarian legal entity facts kept intact', () => {
    const doc = getLegalDoc('terms', 'en');
    expect(doc.title).toBe('Terms of Service');
    expect(doc.intro).toContain(COMPANY.legalName);
    expect(doc.intro).toContain('Fakturcho');
    expect(doc.sections[0]?.paragraphs[0]).toContain('EIK 208697044');
    expect(doc.lastUpdatedLabel).toBe(`Last updated: ${COMPANY.lastUpdated}`);
  });

  it.each(['privacy', 'refunds'] as const)(
    'produces the same number of sections for %s in both locales',
    (id) => {
      const bg = getLegalDoc(id, 'bg');
      const en = getLegalDoc(id, 'en');
      expect(en.sections.length).toBe(bg.sections.length);
      for (let index = 0; index < bg.sections.length; index += 1) {
        expect(en.sections[index]?.paragraphs.length).toBe(bg.sections[index]?.paragraphs.length);
      }
    },
  );
});

describe('getLegalFooterLinks', () => {
  it('keeps the Bulgarian labels unchanged', () => {
    expect(getLegalFooterLinks('bg')).toEqual({
      terms: 'Общи условия',
      privacy: 'Политика за поверителност',
      refunds: 'Възстановяване на суми',
      contact: 'Контакт',
    });
  });

  it('provides English labels', () => {
    expect(getLegalFooterLinks('en')).toEqual({
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      refunds: 'Refunds',
      contact: 'Contact',
    });
  });
});
