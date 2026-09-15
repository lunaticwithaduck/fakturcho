import { describe, expect, it } from 'vitest';
import { CLASSIC_LABELS } from '../labels';
import type { ClassicLocaleContext } from '../locale';
import { buildFakeDocument, buildFakeLineItems } from '../testing/fake-document';
import { itMentions } from './it';

const locale: ClassicLocaleContext = {
  language: 'it',
  labels: CLASSIC_LABELS.it,
  issuerCountry: 'IT',
  showMol: false,
  showSignatureRow: false,
  showOriginalStamp: false,
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
      "Operazione non imponibile ai sensi dell'art. 41, comma 1, lett. a), D.L. 331/1993",
    ]);
  });

  it('cites the cross-border reverse charge for an AE line to a foreign client', () => {
    const input = buildInput({ recipientCountry: 'DE', vatAmount: 0, amount: 100000 }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      "Inversione contabile ai sensi dell'art. 7-ter, D.P.R. 633/1972",
    ]);
  });

  it('cites the domestic reverse charge for an AE line to an Italian client', () => {
    const input = buildInput({ recipientCountry: 'IT', vatAmount: 0, amount: 100000 }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      "Inversione contabile ai sensi dell'art. 17, comma 6, D.P.R. 633/1972",
    ]);
  });

  it('adds the virtual stamp duty mention above the 77.47 threshold with no VAT charged', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, documentType: 'INVOICE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([
      "Imposta di bollo assolta in modo virtuale ai sensi dell'art. 15 della Tariffa, Parte I, allegata al D.P.R. 642/1972 e del D.M. 17/06/2014",
    ]);
  });

  it('does not add the stamp duty mention at or below the threshold', () => {
    const input = buildInput({ vatAmount: 0, amount: 7747, documentType: 'INVOICE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([]);
  });

  it('does not add the stamp duty mention on a reverse-charge or intra-EU document', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, recipientCountry: 'DE' }, [
      { vatCategory: 'AE', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).not.toContain(
      "Imposta di bollo assolta in modo virtuale ai sensi dell'art. 15 della Tariffa, Parte I, allegata al D.P.R. 642/1972 e del D.M. 17/06/2014",
    );
  });

  it('does not add the stamp duty mention on a quote', () => {
    const input = buildInput({ vatAmount: 0, amount: 100000, documentType: 'QUOTE' }, [
      { vatCategory: 'E', vatRateBp: 0 },
    ]);
    expect(itMentions(input)).toEqual([]);
  });
});
