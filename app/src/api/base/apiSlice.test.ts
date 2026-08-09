import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_TAG_TYPES, apiSlice } from './apiSlice';
import { installFetchMock, jsonResponse } from './testFetchMock';

function createTestStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

describe('apiSlice base query', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    fetchMock = installFetchMock();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefixes every request with /api and sends the session cookie', async () => {
    const testApi = apiSlice.injectEndpoints({
      endpoints: (builder) => ({
        ping: builder.query<{ ok: boolean }, void>({ query: () => '/ping' }),
      }),
      overrideExisting: true,
    });
    const store = createTestStore();

    await store.dispatch(testApi.endpoints.ping.initiate());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/ping');
    expect(request.credentials).toBe('include');
  });

  it('declares one tag type per invalidation domain the endpoints rely on', () => {
    expect(API_TAG_TYPES).toEqual([
      'IssuerProfile',
      'Client',
      'CatalogueItem',
      'Document',
      'Series',
      'Subscription',
      'CreditBalance',
      'CreditLedger',
    ]);
  });

  it('uses a single, stable reducer path for the store slice', () => {
    expect(apiSlice.reducerPath).toBe('api');
  });
});
