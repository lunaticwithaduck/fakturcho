import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';
import type { ExchangeRateHttpClient, ExchangeRateQuote } from './exchange-rate.service';

const REQUEST_TIMEOUT_MS = 8000;

export class NbpExchangeRateHttpClient implements ExchangeRateHttpClient {
  async fetchRateOn(currency: string, isoDate: string): Promise<ExchangeRateQuote | null> {
    const res = await fetch(
      `https://api.nbp.pl/api/exchangerates/rates/a/${currency.toLowerCase()}/${isoDate}/?format=json`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`NBP rate fetch failed with status ${res.status}`);
    const parsed = (await res.json()) as {
      rates?: Array<{ mid?: number; no?: string; effectiveDate?: string }>;
    };
    const entry = parsed.rates?.[0];
    if (!entry || typeof entry.mid !== 'number') return null;
    return {
      rate: String(entry.mid),
      rateDate: entry.effectiveDate ?? isoDate,
      table: entry.no ?? null,
    };
  }
}

// curs.bnr.ro is BNR's dedicated XML server (the www.bnr.ro site redesign
// dropped the old direct file paths); the current day is nbrfxrates.xml and
// every past day sits in a yearly archive, both as
// <Cube date="..."><Rate currency="EUR">value</Rate>.
export class BnrExchangeRateHttpClient implements ExchangeRateHttpClient {
  async fetchRateOn(currency: string, isoDate: string): Promise<ExchangeRateQuote | null> {
    const year = isoDate.slice(0, 4);
    const res = await fetch(`https://curs.bnr.ro/files/xml/years/nbrfxrates${year}.xml`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`BNR rate fetch failed with status ${res.status}`);
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const cube = xpath.select1(`//*[local-name()='Cube'][@date='${isoDate}']`, doc);
    if (!cube) return null;
    const rateNode = xpath.select1(
      `.//*[local-name()='Rate'][@currency='${currency}']`,
      cube as unknown as Node,
    );
    const value = rateNode ? (rateNode as unknown as Element).textContent?.trim() : null;
    if (!value) return null;
    return { rate: value, rateDate: isoDate, table: null };
  }
}

// ECB reference rates via the SDW API (EXR dataset), quoted as units of the
// target currency per one euro — the ratio art. 91(2) asks for directly.
export class EcbExchangeRateHttpClient implements ExchangeRateHttpClient {
  async fetchRateOn(currency: string, isoDate: string): Promise<ExchangeRateQuote | null> {
    const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A?startPeriod=${isoDate}&endPeriod=${isoDate}&format=csvdata`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: 'text/csv' },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`ECB rate fetch failed with status ${res.status}`);
    const csv = (await res.text()).trim();
    if (!csv) return null;
    const [headerLine, dataLine] = csv.split('\n');
    if (!headerLine || !dataLine) return null;
    const header = headerLine.split(',');
    const valueIndex = header.indexOf('OBS_VALUE');
    const timeIndex = header.indexOf('TIME_PERIOD');
    if (valueIndex === -1) return null;
    const row = dataLine.split(',');
    const value = row[valueIndex];
    if (!value) return null;
    return {
      rate: value,
      rateDate: timeIndex !== -1 ? (row[timeIndex] ?? isoDate) : isoDate,
      table: null,
    };
  }
}
