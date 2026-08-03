import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiSlice } from '../base/apiSlice';
import { installFetchMock, jsonResponse } from '../base/testFetchMock';
import { clientsApi } from './clientsEndpoints';

function createTestStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

describe('clientsEndpoints wiring', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    fetchMock = installFetchMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the clients collection url', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const store = createTestStore();

    await store.dispatch(clientsApi.endpoints.listClients.initiate());

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/clients');
  });

  it('requests a single client by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    const store = createTestStore();

    await store.dispatch(clientsApi.endpoints.getClient.initiate('c1'));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/clients/c1');
  });

  it('sends a DELETE request for the given client id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    const store = createTestStore();

    await store.dispatch(clientsApi.endpoints.deleteClient.initiate('c9'));

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(new URL(request.url).pathname).toBe('/api/clients/c9');
    expect(request.method).toBe('DELETE');
  });

  it('refetches the client list once a mutation invalidates it', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'c2', companyName: 'Нова фирма' }))
      .mockResolvedValueOnce(jsonResponse([{ id: 'c2', companyName: 'Нова фирма' }]));
    const store = createTestStore();

    await store.dispatch(clientsApi.endpoints.listClients.initiate());
    await store.dispatch(clientsApi.endpoints.createClient.initiate({ companyName: 'Нова фирма' }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [refetchRequest] = fetchMock.mock.calls[2] as [Request];
    expect(new URL(refetchRequest.url).pathname).toBe('/api/clients');
  });
});
