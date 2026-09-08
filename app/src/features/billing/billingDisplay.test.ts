import { describe, expect, it } from 'vitest';
import {
  balanceCaption,
  CREDIT_LEDGER_REASON_LABELS,
  getPackOptions,
  getSubscriptionTierOptions,
} from './billingDisplay';

describe('CREDIT_LEDGER_REASON_LABELS', () => {
  it('labels every ledger reason in Bulgarian', () => {
    expect(CREDIT_LEDGER_REASON_LABELS).toEqual({
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
    expect(balanceCaption({ balanceCents: 100, documentsRemaining: 10 })).toBe('още 10 документа');
  });

  it('uses the singular form for one remaining document', () => {
    expect(balanceCaption({ balanceCents: 10, documentsRemaining: 1 })).toBe('още 1 документ');
  });

  it('handles an empty balance', () => {
    expect(balanceCaption({ balanceCents: 0, documentsRemaining: 0 })).toBe('още 0 документа');
  });
});

describe('getPackOptions', () => {
  it('derives price and document count for every pack', () => {
    expect(getPackOptions()).toEqual([
      { id: 'pack5', priceLabel: '5,00 €', documentsLabel: '50 документа' },
      { id: 'pack10', priceLabel: '10,00 €', documentsLabel: '100 документа' },
      { id: 'pack25', priceLabel: '25,00 €', documentsLabel: '250 документа' },
    ]);
  });
});

describe('getSubscriptionTierOptions', () => {
  it('derives title, body and grant label for every tier', () => {
    expect(getSubscriptionTierOptions()).toEqual([
      {
        id: 'sub5',
        title: '100 документа на месец за 5,00 €',
        body: 'Зарежда 10,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '10,00 €',
      },
      {
        id: 'sub10',
        title: '200 документа на месец за 10,00 €',
        body: 'Зарежда 20,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '20,00 €',
      },
      {
        id: 'sub25',
        title: '500 документа на месец за 25,00 €',
        body: 'Зарежда 50,00 € кредит всеки месец; неизползваният кредит се запазва.',
        grantLabel: '50,00 €',
      },
    ]);
  });
});
