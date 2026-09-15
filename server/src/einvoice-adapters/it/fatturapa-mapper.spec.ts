import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { itDomesticStandardInvoice } from './__fixtures__/it-domestic-standard';
import { toFatturaPaXml } from './fatturapa-mapper';

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('toFatturaPaXml — IT domestic, standard 22% rate', () => {
  const xml = toFatturaPaXml(itDomesticStandardInvoice);

  it('starts with an XML declaration and a single FatturaElettronica root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><p:FatturaElettronica')).toBe(
      true,
    );
    expect(countOccurrences(xml, '<p:FatturaElettronica ')).toBe(1);
    expect(xml.endsWith('</p:FatturaElettronica>')).toBe(true);
  });

  it('carries the header, body and transmission format', () => {
    expect(xml).toContain('<FatturaElettronicaHeader>');
    expect(xml).toContain('<FatturaElettronicaBody>');
    expect(xml).toContain('<FormatoTrasmissione>FPR12</FormatoTrasmissione>');
    expect(xml).toContain('<CodiceDestinatario>0000000</CodiceDestinatario>');
  });

  it('carries the document type code and currency', () => {
    expect(xml).toContain('<TipoDocumento>TD01</TipoDocumento>');
    expect(xml).toContain('<Divisa>EUR</Divisa>');
  });

  it('carries issuer and recipient names with stripped Partita IVA digits', () => {
    expect(xml).toContain('<Denominazione>Rossi Consulting S.r.l.</Denominazione>');
    expect(xml).toContain('<Denominazione>Bianchi S.p.A.</Denominazione>');
    expect(xml).toContain('<IdPaese>IT</IdPaese><IdCodice>01234567897</IdCodice>');
    expect(xml).toContain('<IdPaese>IT</IdPaese><IdCodice>98765432103</IdCodice>');
  });

  it('carries the Codice Fiscale on both parties', () => {
    expect(xml).toContain('<CodiceFiscale>01234567897</CodiceFiscale>');
    expect(xml).toContain('<CodiceFiscale>98765432103</CodiceFiscale>');
  });

  it('carries the recipient Comune from the structured city, not the free-text address', () => {
    expect(xml).toContain('<Comune>Torino</Comune>');
  });

  it('falls back to the last comma segment of the address when city is missing', () => {
    const legacy: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: { ...itDomesticStandardInvoice.recipient, city: null },
    };
    expect(toFatturaPaXml(legacy)).toContain('<Comune>10121 Torino</Comune>');
  });

  it('carries the Provincia for both parties when set on an IT address', () => {
    const withProvincia: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, countyRegion: 'MI' },
      recipient: { ...itDomesticStandardInvoice.recipient, countyRegion: 'TO' },
    };
    const withProvinciaXml = toFatturaPaXml(withProvincia);
    expect(withProvinciaXml).toContain('<Comune>Milano</Comune><Provincia>MI</Provincia>');
    expect(withProvinciaXml).toContain('<Comune>Torino</Comune><Provincia>TO</Provincia>');
  });

  it('omits Provincia when the party address is outside Italy', () => {
    const foreignRecipient: DocumentDto = {
      ...itDomesticStandardInvoice,
      recipient: {
        ...itDomesticStandardInvoice.recipient,
        country: 'FR',
        countyRegion: '75',
      },
    };
    expect(toFatturaPaXml(foreignRecipient)).not.toContain('<Provincia>75</Provincia>');
  });

  it('omits Provincia when unset', () => {
    expect(xml).not.toContain('<Provincia>');
  });

  it('carries the standard 22.00 VAT rate with no Natura code', () => {
    expect(xml).toContain('<AliquotaIVA>22.00</AliquotaIVA>');
    expect(xml).not.toContain('<Natura>');
  });

  it('carries one DatiRiepilogo with the taxable and VAT amounts', () => {
    expect(countOccurrences(xml, '<DatiRiepilogo>')).toBe(1);
    expect(xml).toContain('<ImponibileImporto>1000.00</ImponibileImporto>');
    expect(xml).toContain('<Imposta>220.00</Imposta>');
  });

  it('carries one DettaglioLinee with the line description and amounts', () => {
    expect(countOccurrences(xml, '<DettaglioLinee>')).toBe(1);
    expect(xml).toContain('<Descrizione>Servizi di consulenza gestionale</Descrizione>');
    expect(xml).toContain('<PrezzoUnitario>1000.00</PrezzoUnitario>');
    expect(xml).toContain('<PrezzoTotale>1000.00</PrezzoTotale>');
  });

  it('carries the payment means mapped to MP05 with the due date and IBAN', () => {
    expect(xml).toContain('<ModalitaPagamento>MP05</ModalitaPagamento>');
    expect(xml).toContain('<DataScadenzaPagamento>2026-09-19</DataScadenzaPagamento>');
    expect(xml).toContain('<IBAN>IT60X0542811101000000123456</IBAN>');
  });

  it('does not emit PECDestinatario when no options are supplied', () => {
    expect(xml).not.toContain('<PECDestinatario>');
  });
});

describe('toFatturaPaXml — options: sdiRecipientCode and pec', () => {
  it('uses the supplied SDI recipient code instead of the zero placeholder', () => {
    const xml = toFatturaPaXml(itDomesticStandardInvoice, { sdiRecipientCode: 'ABC1234' });
    expect(xml).toContain('<CodiceDestinatario>ABC1234</CodiceDestinatario>');
    expect(xml).not.toContain('<PECDestinatario>');
  });

  it('keeps the zero placeholder and adds PECDestinatario when only a PEC is supplied', () => {
    const xml = toFatturaPaXml(itDomesticStandardInvoice, {
      pec: 'fatture@bianchi.legalmail.it',
    });
    expect(xml).toContain('<CodiceDestinatario>0000000</CodiceDestinatario>');
    expect(xml).toContain('<PECDestinatario>fatture@bianchi.legalmail.it</PECDestinatario>');
  });

  it('prefers the SDI recipient code and omits PECDestinatario when both are supplied', () => {
    const xml = toFatturaPaXml(itDomesticStandardInvoice, {
      sdiRecipientCode: 'ABC1234',
      pec: 'fatture@bianchi.legalmail.it',
    });
    expect(xml).toContain('<CodiceDestinatario>ABC1234</CodiceDestinatario>');
    expect(xml).not.toContain('<PECDestinatario>');
  });
});

describe('toFatturaPaXml — Natura codes for non-standard VAT categories', () => {
  it('emits N3.2 and a RiferimentoNormativo for an intra-community supply line', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      vatExemptionGround: 'чл.22 от ЗДДС',
      vatRateBp: 0,
      vatAmount: 0,
      amount: 100000,
      lineItems: [
        {
          id: 'line-1',
          name: 'Servizi di consulenza gestionale',
          quantity: '1',
          unitPrice: 100000,
          lineTotal: 100000,
          sortOrder: 0,
          vatRateBp: 0,
          vatCategory: 'K',
          unitCode: 'C62',
        },
      ],
    };
    const xml = toFatturaPaXml(document);
    expect(xml).toContain('<AliquotaIVA>0.00</AliquotaIVA><Natura>N3.2</Natura>');
    expect(xml).toContain('<RiferimentoNormativo>чл.22 от ЗДДС</RiferimentoNormativo>');
  });
});

describe('toFatturaPaXml — document type codes', () => {
  it('maps credit_note to TD04', () => {
    const document: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'credit_note' };
    expect(toFatturaPaXml(document)).toContain('<TipoDocumento>TD04</TipoDocumento>');
  });

  it('maps debit_note to TD05', () => {
    const document: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'debit_note' };
    expect(toFatturaPaXml(document)).toContain('<TipoDocumento>TD05</TipoDocumento>');
  });

  it('throws for a document type with no FatturaPA export', () => {
    const document: DocumentDto = { ...itDomesticStandardInvoice, documentType: 'proforma' };
    expect(() => toFatturaPaXml(document)).toThrow(
      'toFatturaPaXml: document type "proforma" has no FatturaPA export.',
    );
  });
});

describe('toFatturaPaXml — RegimeFiscale and IscrizioneREA', () => {
  it('uses RF01 for a VAT-registered issuer', () => {
    expect(toFatturaPaXml(itDomesticStandardInvoice)).toContain(
      '<RegimeFiscale>RF01</RegimeFiscale>',
    );
  });

  it('uses RF19 for a forfettario (non VAT-registered) issuer', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: { ...itDomesticStandardInvoice.issuer, vatRegistered: false },
    };
    expect(toFatturaPaXml(document)).toContain('<RegimeFiscale>RF19</RegimeFiscale>');
  });

  it('omits IscrizioneREA when no REA identifier is set', () => {
    expect(toFatturaPaXml(itDomesticStandardInvoice)).not.toContain('<IscrizioneREA>');
  });

  it('emits IscrizioneREA with office, number and share capital when set', () => {
    const document: DocumentDto = {
      ...itDomesticStandardInvoice,
      issuer: {
        ...itDomesticStandardInvoice.issuer,
        identifiers: { rea: 'MI-1234567', shareCapital: '€ 10.000,00 i.v.' },
      },
    };
    const xml = toFatturaPaXml(document);
    expect(xml).toContain(
      '<IscrizioneREA><Ufficio>MI</Ufficio><NumeroREA>1234567</NumeroREA><CapitaleSociale>10000.00</CapitaleSociale><StatoLiquidazione>LN</StatoLiquidazione></IscrizioneREA>',
    );
  });
});

describe('toFatturaPaXml — a document discount is reflected in DatiRiepilogo', () => {
  it('keeps DatiRiepilogo consistent with the discounted taxable base', () => {
    const discounted: DocumentDto = {
      ...itDomesticStandardInvoice,
      subtotal: 100000,
      discountTotal: 10000,
      vatAmount: 14940,
      amount: 104940,
      lineItems: [
        {
          id: 'line-1',
          name: 'Consulenza',
          quantity: '1',
          unitPrice: 60000,
          lineTotal: 60000,
          sortOrder: 0,
          vatRateBp: 2100,
          vatCategory: 'S',
          unitCode: null,
        },
        {
          id: 'line-2',
          name: 'Materiale',
          quantity: '1',
          unitPrice: 40000,
          lineTotal: 40000,
          sortOrder: 1,
          vatRateBp: 1000,
          vatCategory: 'S',
          unitCode: null,
        },
      ],
    };
    const xml = toFatturaPaXml(discounted);

    const riepilogoStart = xml.indexOf('<DatiRiepilogo>');
    const riepilogoBlock = xml.slice(riepilogoStart);

    expect(riepilogoBlock).toContain('<ImponibileImporto>540.00</ImponibileImporto>');
    expect(riepilogoBlock).toContain('<Imposta>113.40</Imposta>');
    expect(riepilogoBlock).toContain('<ImponibileImporto>360.00</ImponibileImporto>');
    expect(riepilogoBlock).toContain('<Imposta>36.00</Imposta>');

    const taxableSum = [
      ...riepilogoBlock.matchAll(/<ImponibileImporto>([\d.]+)<\/ImponibileImporto>/g),
    ].reduce((sum, m) => sum + Number(m[1]), 0);
    const vatSum = [...riepilogoBlock.matchAll(/<Imposta>([\d.]+)<\/Imposta>/g)].reduce(
      (sum, m) => sum + Number(m[1]),
      0,
    );

    expect(taxableSum.toFixed(2)).toBe('900.00');
    expect(vatSum.toFixed(2)).toBe('149.40');
  });
});
