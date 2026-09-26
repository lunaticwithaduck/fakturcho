import { describe, expect, it } from 'vitest';
import { CLASSIC_LABELS } from '../labels';
import type { ClassicLocaleContext } from '../locale';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { itMentions } from './it';

const locale: ClassicLocaleContext = {
  language: 'it',
  labels: CLASSIC_LABELS.it,
  issuerCountry: 'IT',
  timeZone: 'Europe/Rome',
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
  showDeliveryNotePrices: false,
  taxEventDateAlwaysShown: false,
};

function buildInput(
  documentOverrides: Record<string, unknown>,
  lineItemOverrides: Record<string, unknown>[],
) {
  const document = buildFakeDocument({
    documentType: 'INVOICE',
    issuerCountry: 'IT',
    recipientCountry: 'IT',
    vatAmount: 22000,
    amount: 122000,
    ...documentOverrides,
  });
  const lineItems = lineItemOverrides.flatMap((overrides, index) =>
    buildFakeLineItems({ id: `li_${index}`, ...overrides }),
  );
  return { document, lineItems, locale };
}

describe('itMentions', () => {
  it('is silent on a plain standard-rate domestic invoice', () => {
    const input = buildInput({}, [{ vatCategory: 'S', vatRateBp: 2200 }]);
    expect(itMentions(input)).toEqual([]);
  });

  it('cites the intra-community exemption for a K line', () => {
    const input = buildInput({ recipientCountry: 'FR', vatAmount: 0, amount: 100000 }, [
      { vatCategory: 'K', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      'Operazione non imponibile ai sensi dell’art. 41, comma 1, lett. a), D.L. 331/1993',
    ]);
  });

  it('cites the cross-border reverse charge for an AE line to a foreign client', () => {
    const input = buildInput({ recipientCountry: 'DE', vatAmount: 0, amount: 100000 }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      'Inversione contabile – art. 7-ter, comma 1, lett. a), D.P.R. 633/1972',
      'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014',
    ]);
  });

  it('cites the domestic reverse charge for an AE line to an Italian client', () => {
    const input = buildInput({ recipientCountry: 'IT', vatAmount: 0, amount: 100000 }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      'Inversione contabile ai sensi dell’art. 17, comma 6, D.P.R. 633/1972',
    ]);
  });

  it('does not repeat the reverse-charge mention when the issuer already chose it as the exemption ground', () => {
    const input = buildInput(
      {
        recipientCountry: 'DE',
        vatAmount: 0,
        amount: 100000,
        vatExemptionGround: 'Inversione contabile – art. 7-ter, comma 1, lett. a), D.P.R. 633/1972',
      },
      [{ vatCategory: 'AE', vatRateBp: 0 }],
    );
    expect(itMentions(input)).toEqual([
      'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014',
    ]);
  });

  it('adds the virtual stamp duty mention above the 77.47 threshold with no VAT charged', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, documentType: 'INVOICE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014',
    ]);
  });

  it('does not add the stamp duty mention at or below the threshold', () => {
    const input = buildInput({ vatAmount: 0, amount: 7747, documentType: 'INVOICE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([]);
  });

  it('does not add the stamp duty mention on a domestic reverse-charge or intra-EU document', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, recipientCountry: 'IT' }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).not.toContain(
      'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014',
    );
  });

  it('does not add the stamp duty mention on a quote', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, documentType: 'QUOTE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([]);
  });

  it('adds the stamp duty mention on a mixed invoice once the untaxed lines exceed the threshold (Ris. AdE 444/E/2008)', () => {
    const input = buildInput({ vatAmount: 4400, amount: 104400 }, [
      { vatCategory: 'S', vatRateBp: 2200, lineTotal: 20000 },
      { vatCategory: 'E', vatRateBp: 0, lineTotal: 100000 },
    ]);
    expect(itMentions(input)).toEqual([
      'Imposta di bollo assolta in modo virtuale ai sensi dell’art. 6 del D.M. 17 giugno 2014',
    ]);
  });

  it('does not add the stamp duty mention on a mixed invoice when the untaxed lines stay at or below the threshold', () => {
    const input = buildInput({ vatAmount: 4400, amount: 27747 }, [
      { vatCategory: 'S', vatRateBp: 2200, lineTotal: 20000 },
      { vatCategory: 'E', vatRateBp: 0, lineTotal: 7747 },
    ]);
    expect(itMentions(input)).toEqual([]);
  });

  it('excludes a domestic reverse-charge line from the mixed-invoice stamp duty sum', () => {
    const input = buildInput({ vatAmount: 4400, amount: 104400, recipientCountry: 'IT' }, [
      { vatCategory: 'S', vatRateBp: 2200, lineTotal: 20000 },
      { vatCategory: 'AE', vatRateBp: 0, lineTotal: 100000 },
    ]);
    expect(itMentions(input)).toEqual([
      'Inversione contabile ai sensi dell’art. 17, comma 6, D.P.R. 633/1972',
    ]);
  });

  it('excludes an intra-EU goods (K) line from the mixed-invoice stamp duty sum', () => {
    const input = buildInput({ vatAmount: 4400, amount: 104400, recipientCountry: 'FR' }, [
      { vatCategory: 'S', vatRateBp: 2200, lineTotal: 20000 },
      { vatCategory: 'K', vatRateBp: 0, lineTotal: 100000 },
    ]);
    expect(itMentions(input)).toEqual([
      'Operazione non imponibile ai sensi dell’art. 41, comma 1, lett. a), D.L. 331/1993',
    ]);
  });
});
