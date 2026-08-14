import { describe, expect, it } from 'vitest';
import { COMPANY, COMPANY_PLACEHOLDER_MARKER } from './company';

describe('legal entity details', () => {
  it('carries no demo placeholders — the policy pages state who the contracting entity is', () => {
    const identityFields = [
      COMPANY.legalName,
      COMPANY.eik,
      COMPANY.address,
      COMPANY.supportEmail,
    ];
    const unfilled = identityFields.filter(
      (value) => value.includes(COMPANY_PLACEHOLDER_MARKER) || value.endsWith('example.com'),
    );
    expect(unfilled).toEqual([]);
  });
});
