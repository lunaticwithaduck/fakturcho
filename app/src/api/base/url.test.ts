import { describe, expect, it } from 'vitest';
import { toApiPath } from './url';

describe('toApiPath', () => {
  it('strips the /api prefix from an absolute route', () => {
    expect(toApiPath('/api/clients')).toBe('/clients');
  });

  it('strips the prefix from a route built with a dynamic segment', () => {
    expect(toApiPath('/api/documents/doc-1/issue')).toBe('/documents/doc-1/issue');
  });

  it('collapses the bare /api route to a single slash', () => {
    expect(toApiPath('/api')).toBe('/');
  });

  it('leaves a route without the /api prefix untouched', () => {
    expect(toApiPath('/billing/subscription')).toBe('/billing/subscription');
  });
});
