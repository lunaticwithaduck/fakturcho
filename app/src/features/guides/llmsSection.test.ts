import { describe, expect, it } from 'vitest';
import { guidesLlmsSection } from './llmsSection';
import type { GuideContent } from './types';

const GUIDE: GuideContent = {
  country: 'DE',
  locale: 'de',
  slug: 'rechnung-pflichtangaben',
  title: 'Rechnung Pflichtangaben | Fakturcho',
  description: 'Was auf einer Rechnung stehen muss.',
  h1: 'Rechnung schreiben in Deutschland',
  answer: 'answer',
  lastReviewed: '2026-09-25',
  sections: [],
  faqHeading: 'FAQ',
  faq: [],
  cta: { heading: 'CTA', body: [] },
};

describe('guidesLlmsSection', () => {
  it('returns an empty string when there are no guides yet', () => {
    expect(guidesLlmsSection('Guides', [])).toBe('');
  });

  it('lists each guide as a markdown bullet with its absolute URL and description', () => {
    const section = guidesLlmsSection('Guides', [GUIDE]);
    expect(section).toContain('## Guides');
    expect(section).toContain(
      '- [Rechnung Pflichtangaben | Fakturcho](https://www.fakturcho.com/de/guide/rechnung-pflichtangaben): Was auf einer Rechnung stehen muss.',
    );
  });
});
