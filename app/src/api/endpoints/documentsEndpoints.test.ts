import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiSlice } from '../base/apiSlice';
import { installFetchMock, jsonResponse } from '../base/testFetchMock';
import { documentsApi, getDocumentPreviewUrl, getDocumentRenderUrl } from './documentsEndpoints';

function createTestStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

describe('getDocumentRenderUrl', () => {
  it('builds the full, absolute render path for a document', () => {
    expect(getDocumentRenderUrl('doc-1')).toBe('/api/documents/doc-1/render');
  });
});

describe('getDocumentPreviewUrl', () => {
  it('asks for an inline disposition so the PDF renders instead of downloading', () => {
    expect(getDocumentPreviewUrl('doc-1')).toBe('/api/documents/doc-1/render?disposition=inline');
  });
});

describe('documentsEndpoints wiring', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    fetchMock = installFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends list filters as query parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], total: 0 }));
    const store = createTestStore();

    await store.dispatch(
      documentsApi.endpoints.listDocuments.initiate({ status: 'draft', documentType: 'invoice' }),
    );

    const [request] = fetchMock.mock.calls[0] as [Request];
    const parsed = new URL(request.url);
    expect(parsed.pathname).toBe('/api/documents');
    expect(parsed.searchParams.get('status')).toBe('draft');
    expect(parsed.searchParams.get('documentType')).toBe('invoice');
  });

  it('posts to the issue action for the given document id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'doc-1' }));
    const store = createTestStore();

    await store.dispatch(documentsApi.endpoints.issueDocument.initiate({ id: 'doc-1', body: {} }));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/documents/doc-1/issue');
    expect(request.method).toBe('POST');
  });

  it('requests the numbering series collection', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const store = createTestStore();

    await store.dispatch(documentsApi.endpoints.listSeries.initiate());

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/series');
  });
});
