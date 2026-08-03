import { describe, expect, it } from 'vitest';
import { idTag, listTag, provideList } from './tags';

describe('listTag', () => {
  it('builds a LIST tag for the given type', () => {
    expect(listTag('Client')).toEqual({ type: 'Client', id: 'LIST' });
  });
});

describe('idTag', () => {
  it('builds an entity tag for the given id', () => {
    expect(idTag('Document', 'doc-1')).toEqual({ type: 'Document', id: 'doc-1' });
  });
});

describe('provideList', () => {
  it('tags every item plus the LIST tag when results are present', () => {
    const results = [{ id: 'a' }, { id: 'b' }];
    expect(provideList('CatalogueItem', results)).toEqual([
      { type: 'CatalogueItem', id: 'a' },
      { type: 'CatalogueItem', id: 'b' },
      { type: 'CatalogueItem', id: 'LIST' },
    ]);
  });

  it('falls back to just the LIST tag when results are undefined', () => {
    expect(provideList('CatalogueItem', undefined)).toEqual([
      { type: 'CatalogueItem', id: 'LIST' },
    ]);
  });

  it('returns only the LIST tag for an empty result set', () => {
    expect(provideList('Client', [])).toEqual([{ type: 'Client', id: 'LIST' }]);
  });
});
