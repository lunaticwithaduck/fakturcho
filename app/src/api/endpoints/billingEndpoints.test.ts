import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiSlice } from '../base/apiSlice';
import { installFetchMock, jsonResponse } from '../base/testFetchMock';
import { billingApi } from './billingEndpoints';
import { documentsApi } from './documentsEndpoints';

function createTestStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

function requestedPaths(fetchMock: ReturnType<typeof installFetchMock>): string[] {
  return fetchMock.mock.calls.map(([request]) => new URL((request as Request).url).pathname);
}

describe('billingEndpoints wiring', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    fetchMock = installFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the credit balance', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ balanceCents: 100, documentsRemaining: 10, hasUnlimitedSubscription: false }),
    );
    const store = createTestStore();

    await store.dispatch(billingApi.endpoints.getCreditBalance.initiate());

    expect(requestedPaths(fetchMock)).toEqual(['/api/billing/credits']);
  });

  it('requests the credit ledger', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const store = createTestStore();

    await store.dispatch(billingApi.endpoints.getCreditLedger.initiate());

    expect(requestedPaths(fetchMock)).toEqual(['/api/billing/credits/ledger']);
  });

  it('accepts a null subscription', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));
    const store = createTestStore();

    const result = await store.dispatch(billingApi.endpoints.getSubscription.initiate());

    expect(requestedPaths(fetchMock)).toEqual(['/api/billing/subscription']);
    expect(result.data).toBeNull();
  });

  it('posts the chosen product to checkout', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ checkoutUrl: 'https://pay.example/x' }));
    const store = createTestStore();

    await store.dispatch(billingApi.endpoints.createCheckout.initiate({ product: 'pack10' }));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/billing/checkout');
    expect(request.method).toBe('POST');
    expect(await request.json()).toEqual({ product: 'pack10' });
  });

  it('refetches the credit balance after a document is issued', async () => {
    fetchMock.mockImplementation(async (request: Request) => {
      const path = new URL(request.url).pathname;
      if (path === '/api/billing/credits') {
        return jsonResponse({
          balanceCents: 100,
          documentsRemaining: 10,
          hasUnlimitedSubscription: false,
        });
      }
      return jsonResponse({ id: 'doc-1' });
    });
    const store = createTestStore();

    await store.dispatch(billingApi.endpoints.getCreditBalance.initiate());
    await store.dispatch(documentsApi.endpoints.issueDocument.initiate({ id: 'doc-1', body: {} }));

    await vi.waitFor(() => {
      const balanceRequests = requestedPaths(fetchMock).filter(
        (path) => path === '/api/billing/credits',
      );
      expect(balanceRequests).toHaveLength(2);
    });
  });
});
