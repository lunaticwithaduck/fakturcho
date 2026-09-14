import { getLegalDoc } from '@app/features/legal/legalContent';
import { getMarketingContent } from '@app/features/marketing/content';
import enMessages from '@messages/en.json';
import { describe, expect, it } from 'vitest';

const CYRILLIC = /[Ѐ-ӿ]/;

function assertNoCyrillic(label: string, value: unknown) {
  const text = JSON.stringify(value);
  const match = text.match(CYRILLIC);
  expect(match, `${label} contains Cyrillic: ${match?.[0]}`).toBeNull();
}

describe('English content carries zero Cyrillic', () => {
  it('the en message bundle', () => {
    assertNoCyrillic('messages/en.json', enMessages);
  });

  it('the English marketing content', () => {
    assertNoCyrillic('marketing content (en)', getMarketingContent('en'));
  });

  it.each(['terms', 'privacy', 'refunds'] as const)('the English %s legal doc', (doc) => {
    assertNoCyrillic(`legal doc ${doc} (en)`, getLegalDoc(doc, 'en'));
  });
});
