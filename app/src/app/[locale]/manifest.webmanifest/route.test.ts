import { describe, expect, it } from 'vitest';
import { GET } from './route';

function call(locale: string) {
  return GET(new Request(`https://www.fakturcho.com/${locale}/manifest.webmanifest`), {
    params: Promise.resolve({ locale }),
  });
}

describe('locale manifest route', () => {
  it('serves the German manifest', async () => {
    const response = await call('de');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/manifest+json');
    const body = await response.json();
    expect(body.lang).toBe('de');
    expect(body.start_url).toBe('/de');
  });

  it('returns 404 for bg and unknown locales', async () => {
    expect((await call('bg')).status).toBe(404);
    expect((await call('xx')).status).toBe(404);
  });
});
