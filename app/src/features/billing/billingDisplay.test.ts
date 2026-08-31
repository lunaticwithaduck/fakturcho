import { describe, expect, it } from 'vitest';
import { balanceCaption, CREDIT_LEDGER_REASON_LABELS, getPackOptions } from './billingDisplay';

describe('CREDIT_LEDGER_REASON_LABELS', () => {
  it('labels every ledger reason in Bulgarian', () => {
    expect(CREDIT_LEDGER_REASON_LABELS).toEqual({
      signup_grant: 'Начален бонус',
      purchase: 'Покупка на кредити',
      issuance: 'Издаден документ',
      adjustment: 'Корекция',
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
