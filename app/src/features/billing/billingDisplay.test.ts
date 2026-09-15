import bgMessages from '@messages/bg.json';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import {
  balanceCaption,
  getCreditLedgerReasonLabels,
  getPackOptions,
  getSubscriptionTierOptions,
  type Translate,
} from './billingDisplay';

const t = createTranslator({
  locale: 'bg',
  messages: bgMessages,
  namespace: 'billing',
}) as unknown as Translate;

describe('getCreditLedgerReasonLabels', () => {
  it('labels every ledger reason in Bulgarian', () => {
    expect(getCreditLedgerReasonLabels(t)).toEqual({
      signup_grant: 'Начален бонус',
      purchase: 'Покупка на кредити',
      issuance: 'Издаден документ',
      adjustment: 'Корекция',
      subscription_grant: 'Зареждане от абонамент',
    });
  });
});

describe('balanceCaption', () => {
  it('counts the remaining documents', () => {
    expect(balanceCaption({ balanceCents: 100, documentsRemaining: 10 }, t)).toBe(
      'още 10 документа',
    );
  });

  it('uses the singular form for one remaining document', () => {
    expect(balanceCaption({ balanceCents: 10, documentsRemaining: 1 }, t)).toBe('още 1 документ');
  });

  it('handles an empty balance', () => {
    expect(balanceCaption({ balanceCents: 0, documentsRemaining: 0 }, t)).toBe('още 0 документа');
  });
});

describe('getPackOptions', () => {
  it('derives price and document count for every pack', () => {
    expect(getPackOptions(t)).toEqual([
      {
        id: 'pack5',
        priceLabel: '5,00 €',
        documentsLabel: '50 документа',
        perDocumentLabel: '0,10 € на документ',
      },
      {
        id: 'pack10',
        priceLabel: '10,00 €',
        documentsLabel: '100 документа',
        perDocumentLabel: '0,10 € на документ',
      },
      {
        id: 'pack25',
        priceLabel: '25,00 €',
        documentsLabel: '250 документа',
        perDocumentLabel: '0,10 € на документ',
      },
    ]);
  });
});

describe('getSubscriptionTierOptions', () => {
  it('derives title, body and grant label for every tier', () => {
    expect(getSubscriptionTierOptions(t)).toEqual([
      {
        id: 'sub5',
        title: '100 документа на месец за 5,00 €',
        body: 'Зарежда 10,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '10,00 €',
        perDocumentLabel: '0,05 € на документ',
      },
      {
        id: 'sub10',
        title: '200 документа на месец за 10,00 €',
        body: 'Зарежда 20,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '20,00 €',
        perDocumentLabel: '0,05 € на документ',
      },
      {
        id: 'sub25',
        title: '500 документа на месец за 25,00 €',
        body: 'Зарежда 50,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '50,00 €',
        perDocumentLabel: '0,05 € на документ',
      },
    ]);
  });
});
