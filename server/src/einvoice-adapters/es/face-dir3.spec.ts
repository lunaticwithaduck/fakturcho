import { describe, expect, it } from 'vitest';
import {
  formatDir3BuyerReference,
  isPublicBodyRecipient,
  parseDir3BuyerReference,
} from './face-dir3';

const CODES = {
  organoGestor: 'L01280796',
  unidadTramitadora: 'L01280796',
  oficinaContable: 'L01280796',
};

describe('formatDir3BuyerReference / parseDir3BuyerReference', () => {
  it('round-trips DIR3 codes through buyerReference', () => {
    const buyerReference = formatDir3BuyerReference(CODES);
    expect(buyerReference).toBe('DIR3:L01280796:L01280796:L01280796');
    expect(parseDir3BuyerReference(buyerReference)).toEqual(CODES);
  });

  it('returns null for an ordinary purchase-order reference', () => {
    expect(parseDir3BuyerReference('PEDIDO-2026-77')).toBeNull();
  });

  it('returns null for null, empty or malformed input', () => {
    expect(parseDir3BuyerReference(null)).toBeNull();
    expect(parseDir3BuyerReference('')).toBeNull();
    expect(parseDir3BuyerReference('DIR3:only-one-code')).toBeNull();
    expect(parseDir3BuyerReference('DIR3:not-a-code:L01280796:L01280796')).toBeNull();
  });
});

describe('isPublicBodyRecipient', () => {
  it('is true only when the buyerReference carries valid DIR3 codes', () => {
    expect(isPublicBodyRecipient(formatDir3BuyerReference(CODES))).toBe(true);
    expect(isPublicBodyRecipient('PEDIDO-2026-77')).toBe(false);
    expect(isPublicBodyRecipient(null)).toBe(false);
  });
});
