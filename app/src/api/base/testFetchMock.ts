import { vi } from 'vitest';

/**
 * Node's fetch/Request implementation, unlike a browser, has no document
 * origin to resolve a relative URL against, so `new Request('/api/x')`
 * throws. fetchBaseQuery always builds a Request internally before handing
 * it to fetch, so tests need this shim even though the app's relative
 * baseUrl is correct for the real, browser-hosted app.
 */
export function installFetchMock() {
  const fetchMock = vi.fn();
  const OriginalRequest = globalThis.Request;

  class TestRequest extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const resolved =
        typeof input === 'string' && input.startsWith('/') ? `http://localhost${input}` : input;
      super(resolved, init);
    }
  }

  vi.stubGlobal('Request', TestRequest);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
