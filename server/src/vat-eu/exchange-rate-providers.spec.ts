import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BnrExchangeRateHttpClient,
  EcbExchangeRateHttpClient,
  NbpExchangeRateHttpClient,
} from './exchange-rate-providers';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// Real shape from https://api.nbp.pl/api/exchangerates/rates/a/eur/2026-09-23/?format=json
const NBP_EUR_RESPONSE = {
  table: 'A',
  currency: 'euro',
  code: 'EUR',
  rates: [{ no: '185/A/NBP/2026', effectiveDate: '2026-09-23', mid: 4.3588 }],
};

describe('NbpExchangeRateHttpClient', () => {
  it('requests table A for the given currency and date, lowercased in the URL', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(NBP_EUR_RESPONSE));
    vi.stubGlobal('fetch', fetchMock);

    const client = new NbpExchangeRateHttpClient();
    const quote = await client.fetchRateOn('EUR', '2026-09-23');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.nbp.pl/api/exchangerates/rates/a/eur/2026-09-23/?format=json',
      expect.anything(),
    );
    expect(quote).toEqual({ rate: '4.3588', rateDate: '2026-09-23', table: '185/A/NBP/2026' });
  });

  it('returns null when NBP has no table A entry for that code (e.g. the local currency itself)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Not Found', 404)),
    );
    const client = new NbpExchangeRateHttpClient();
    // PLN is never quoted against itself in table A — this is the exact shape
    // of the bug: asking NBP for "PLN" 404s, asking for "EUR" does not.
    expect(await client.fetchRateOn('PLN', '2026-09-23')).toBeNull();
  });

  it('throws on a non-404 error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Internal Server Error', 500)),
    );
    const client = new NbpExchangeRateHttpClient();
    await expect(client.fetchRateOn('EUR', '2026-09-23')).rejects.toThrow(/500/);
  });
});

// Real (trimmed) shape from https://curs.bnr.ro/files/xml/years/nbrfxrates2026.xml
function bnrYearXml(): string {
  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<DataSet xmlns="https://www.bnr.ro/xsd">' +
    '<Header><Publisher>National Bank of Romania</Publisher></Header>' +
    '<Body><Subject>Reference rates</Subject><OrigCurrency>RON</OrigCurrency>' +
    '<Cube date="2026-09-22"><Rate currency="EUR">5.2701</Rate><Rate currency="USD">4.4901</Rate></Cube>' +
    '<Cube date="2026-09-23"><Rate currency="AED">1.2596</Rate><Rate currency="CZK">0.2165</Rate>' +
    '<Rate currency="EUR">5.2788</Rate><Rate currency="HUF" multiplier="100">1.4493</Rate>' +
    '<Rate currency="USD">4.4977</Rate></Cube>' +
    '</Body></DataSet>'
  );
}

describe('BnrExchangeRateHttpClient', () => {
  it('reads the year file and returns the EUR rate for the requested date', async () => {
    const fetchMock = vi.fn(async () => textResponse(bnrYearXml()));
    vi.stubGlobal('fetch', fetchMock);

    const client = new BnrExchangeRateHttpClient();
    const quote = await client.fetchRateOn('EUR', '2026-09-23');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://curs.bnr.ro/files/xml/years/nbrfxrates2026.xml',
      expect.anything(),
    );
    expect(quote).toEqual({ rate: '5.2788', rateDate: '2026-09-23', table: null });
  });

  it('returns null when BNR has no <Rate currency="RON"> (RON is never quoted against itself)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse(bnrYearXml())),
    );
    const client = new BnrExchangeRateHttpClient();
    expect(await client.fetchRateOn('RON', '2026-09-23')).toBeNull();
  });

  it('returns null when the date has no Cube at all', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse(bnrYearXml())),
    );
    const client = new BnrExchangeRateHttpClient();
    expect(await client.fetchRateOn('EUR', '2026-09-20')).toBeNull();
  });

  it('throws on a non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Internal Server Error', 500)),
    );
    const client = new BnrExchangeRateHttpClient();
    await expect(client.fetchRateOn('EUR', '2026-09-23')).rejects.toThrow(/500/);
  });
});

// Real shape from https://data-api.ecb.europa.eu/service/data/EXR/D.CZK.EUR.SP00.A
// ?startPeriod=2026-09-23&endPeriod=2026-09-23&format=csvdata — including the
// quoted TITLE_COMPL field with embedded commas, which sits after the columns
// the parser actually reads (TIME_PERIOD, OBS_VALUE).
const ECB_CZK_CSV =
  'KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS,OBS_CONF,OBS_PRE_BREAK,OBS_COM,TIME_FORMAT,BREAKS,COLLECTION,COMPILING_ORG,DISS_ORG,DOM_SER_IDS,PUBL_ECB,PUBL_MU,PUBL_PUBLIC,UNIT_INDEX_BASE,COMPILATION,COVERAGE,DECIMALS,NAT_TITLE,SOURCE_AGENCY,SOURCE_PUB,TITLE,TITLE_COMPL,UNIT,UNIT_MULT\n' +
  'EXR.D.CZK.EUR.SP00.A,D,CZK,EUR,SP00,A,2026-09-23,24.383,A,F,,,P1D,,A,,,,,,,99Q1=100,,,3,,4F0,,Czech koruna/Euro ECB reference exchange rate,"ECB reference exchange rate, Czech koruna/Euro, 2.15 pm (C.E.T.)",CZK,0\n';

describe('EcbExchangeRateHttpClient', () => {
  it('requests D.{local}.EUR and reads OBS_VALUE/TIME_PERIOD, ignoring later quoted commas', async () => {
    const fetchMock = vi.fn(async () => textResponse(ECB_CZK_CSV, 200));
    vi.stubGlobal('fetch', fetchMock);

    const client = new EcbExchangeRateHttpClient();
    const quote = await client.fetchRateOn('CZK', '2026-09-23');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://data-api.ecb.europa.eu/service/data/EXR/D.CZK.EUR.SP00.A?startPeriod=2026-09-23&endPeriod=2026-09-23&format=csvdata',
      expect.anything(),
    );
    expect(quote).toEqual({ rate: '24.383', rateDate: '2026-09-23', table: null });
  });

  it('returns null on a 404 (no observation for that date)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Not Found', 404)),
    );
    const client = new EcbExchangeRateHttpClient();
    expect(await client.fetchRateOn('CZK', '2026-09-23')).toBeNull();
  });

  it('returns null on an empty CSV body (header only, no data row)', async () => {
    const headerOnly = ECB_CZK_CSV.split('\n')[0] as string;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse(headerOnly)),
    );
    const client = new EcbExchangeRateHttpClient();
    expect(await client.fetchRateOn('CZK', '2026-09-23')).toBeNull();
  });

  it('throws on a non-404 error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => textResponse('Internal Server Error', 500)),
    );
    const client = new EcbExchangeRateHttpClient();
    await expect(client.fetchRateOn('CZK', '2026-09-23')).rejects.toThrow(/500/);
  });
});
