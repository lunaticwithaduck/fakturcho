import { describe, expect, it } from 'vitest';
import { isFrenchPublicSectorRecipient } from './fr-public-sector';

describe('isFrenchPublicSectorRecipient', () => {
  it('is true for a SIRET in the public-sphere SIREN range (leading 1 or 2)', () => {
    expect(isFrenchPublicSectorRecipient({ eik: '20000000800009', companyName: 'Testville' })).toBe(
      true,
    );
  });

  it('is false for a private-sector SIREN outside the reserved range', () => {
    expect(
      isFrenchPublicSectorRecipient({ eik: '394426019', companyName: 'Client Exemple SAS' }),
    ).toBe(false);
  });

  it('is true when the name matches a known public-administration marker, even without a usable SIRET', () => {
    expect(isFrenchPublicSectorRecipient({ eik: null, companyName: 'Commune de Testville' })).toBe(
      true,
    );
    expect(
      isFrenchPublicSectorRecipient({ eik: null, companyName: 'Centre Hospitalier de Nantes' }),
    ).toBe(true);
  });

  it('is false for a private company with no identifier and an ordinary name', () => {
    expect(isFrenchPublicSectorRecipient({ eik: null, companyName: 'Client Exemple SAS' })).toBe(
      false,
    );
  });

  it('is false with nothing to go on', () => {
    expect(isFrenchPublicSectorRecipient({ eik: null, companyName: null })).toBe(false);
  });
});
