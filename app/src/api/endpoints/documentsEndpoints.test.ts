import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiSlice } from '../base/apiSlice';
import { installFetchMock, jsonResponse } from '../base/testFetchMock';
import {
  documentsApi,
  getDocumentPreviewUrl,
  getDocumentRenderUrl,
  getEinvoiceXmlUrl,
} from './documentsEndpoints';

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
  it('asks for an inline disposition so the PDF renders instead of downloading it', () => {
    expect(getDocumentPreviewUrl('doc-1')).toBe('/api/documents/doc-1/render?disposition=inline');
  });
});

describe('getEinvoiceXmlUrl', () => {
  it('builds the full, absolute e-invoice XML path for a document', () => {
    expect(getEinvoiceXmlUrl('doc-1')).toBe('/api/documents/doc-1/einvoice/xml');
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

  it('requests the e-invoice readiness for the given document id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ready: true, missingFields: [] }));
    const store = createTestStore();

    await store.dispatch(documentsApi.endpoints.getEinvoiceReadiness.initiate('doc-1'));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/documents/doc-1/einvoice/readiness');
  });

  it('requests the e-invoice transmission for the given document id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));
    const store = createTestStore();

    await store.dispatch(documentsApi.endpoints.getEinvoiceTransmission.initiate('doc-1'));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/documents/doc-1/einvoice/transmission');
  });

  it('posts to the Peppol send action and invalidates the document cache', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 'doc-1' }))
      .mockResolvedValueOnce(
        jsonResponse({
          documentId: 'doc-1',
          status: 'SENT',
          provider: 'test',
          providerMessageId: null,
          receipt: null,
          errorText: null,
          retryCount: 0,
          createdAt: '2026-09-09T00:00:00.000Z',
          updatedAt: '2026-09-09T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'doc-1' }));
    const store = createTestStore();

    await store.dispatch(documentsApi.endpoints.getDocument.initiate('doc-1'));
    await store.dispatch(documentsApi.endpoints.sendEinvoicePeppol.initiate('doc-1'));

    const [sendRequest] = fetchMock.mock.calls[1] as [Request];
    expect(new URL(sendRequest.url).pathname).toBe('/api/documents/doc-1/einvoice/send');
    expect(sendRequest.method).toBe('POST');

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [refetchRequest] = fetchMock.mock.calls[2] as [Request];
    expect(new URL(refetchRequest.url).pathname).toBe('/api/documents/doc-1');
  });
});
