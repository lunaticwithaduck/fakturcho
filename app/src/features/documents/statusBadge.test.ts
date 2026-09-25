import type { DocumentStatus } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { getStatusBadgeVariant } from './statusBadge';

describe('getStatusBadgeVariant', () => {
  const cases: Array<[DocumentStatus, string]> = [
    ['draft', 'neutral'],
    ['sent', 'accent'],
    ['paid', 'success'],
    ['overdue', 'danger'],
    ['cancelled', 'neutral'],
  ];

  it.each(cases)('maps %s to the %s badge variant', (status, expected) => {
    expect(getStatusBadgeVariant(status)).toBe(expected);
  });
});
