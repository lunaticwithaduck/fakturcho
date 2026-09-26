// VAT Directive art. 230: the VAT amount must also appear in the national
// currency of the member state of supply for issuers established there.
// art. 91(2): the ECB's latest selling rate applies unless the member state
// requires its own central bank's rate — PL (ustawa o VAT art. 31a) and RO
// (Codul fiscal art. 319 alin. (20) lit. j) do; CZ, DK, HU and SE accept the
// ECB rate (verified against each state's VAT act — see s2-fx report).
export type ExchangeRateSource = 'NBP' | 'BNR' | 'ECB';

export interface NonEuroVatCountry {
  currency: string;
  // Wording used in the PDF lead-in phrase, which is not always the ISO code
  // (RO invoices conventionally say "lei", not "RON").
  currencyLabel: string;
  currencySymbol: string;
  rateSource: ExchangeRateSource;
}

export const NON_EURO_VAT_COUNTRIES: Record<string, NonEuroVatCountry> = {
  PL: { currency: 'PLN', currencyLabel: 'PLN', currencySymbol: 'zł', rateSource: 'NBP' },
  RO: { currency: 'RON', currencyLabel: 'lei', currencySymbol: 'lei', rateSource: 'BNR' },
  CZ: { currency: 'CZK', currencyLabel: 'CZK', currencySymbol: 'Kč', rateSource: 'ECB' },
  DK: { currency: 'DKK', currencyLabel: 'DKK', currencySymbol: 'kr.', rateSource: 'ECB' },
  HU: { currency: 'HUF', currencyLabel: 'HUF', currencySymbol: 'Ft', rateSource: 'ECB' },
  SE: { currency: 'SEK', currencyLabel: 'SEK', currencySymbol: 'kr', rateSource: 'ECB' },
};

export function nonEuroVatCountry(country: string): NonEuroVatCountry | null {
  return NON_EURO_VAT_COUNTRIES[country] ?? null;
}
