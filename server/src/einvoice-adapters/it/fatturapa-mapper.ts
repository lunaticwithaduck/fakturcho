import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { beniServiziBlock } from './fatturapa-lines';
import { cedentePrestatoreBlock, cessionarioCommittenteBlock } from './fatturapa-parties';
import { dateOnly, el, toAmountString } from './xml';

type FatturaPaDocumentType = 'invoice' | 'credit_note' | 'debit_note';

const TIPO_DOCUMENTO: Record<FatturaPaDocumentType, string> = {
  invoice: 'TD01',
  credit_note: 'TD04',
  debit_note: 'TD05',
};

const PAYMENT_MEANS_TO_MODALITA: Record<string, string> = {
  '10': 'MP01',
  '30': 'MP05',
  '42': 'MP08',
  '58': 'MP05',
};

const COUNTRY_PREFIX_PATTERN = /^[A-Z]{2}/;

function assertFatturaPaEligible(documentType: DocumentType): FatturaPaDocumentType {
  if (
    documentType === 'invoice' ||
    documentType === 'credit_note' ||
    documentType === 'debit_note'
  ) {
    return documentType;
  }
  throw new Error(`toFatturaPaXml: document type "${documentType}" has no FatturaPA export.`);
}

function progressivoInvio(documentId: string): string {
  const sanitized = documentId
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase();
  return sanitized || '0000000001';
}

function transmissionBlock(document: DocumentDto): string {
  const senderVat = document.issuer.vatNumber ?? '';
  const senderDigits = COUNTRY_PREFIX_PATTERN.test(senderVat) ? senderVat.slice(2) : senderVat;
  return (
    '<DatiTrasmissione>' +
    `<IdTrasmittente>${el('IdPaese', 'IT')}${el('IdCodice', senderDigits || '00000000000')}</IdTrasmittente>` +
    el('ProgressivoInvio', progressivoInvio(document.id)) +
    el('FormatoTrasmissione', 'FPR12') +
    el('CodiceDestinatario', '0000000') +
    '</DatiTrasmissione>'
  );
}

function generalDataBlock(document: DocumentDto, kind: FatturaPaDocumentType): string {
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  const idWithAffixes = `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
  return (
    '<DatiGenerali><DatiGeneraliDocumento>' +
    el('TipoDocumento', TIPO_DOCUMENTO[kind]) +
    el('Divisa', document.currency) +
    (document.issuedAt ? el('Data', dateOnly(document.issuedAt)) : '') +
    el('Numero', idWithAffixes) +
    el('ImportoTotaleDocumento', toAmountString(document.amount)) +
    (document.notes ? el('Causale', document.notes) : '') +
    '</DatiGeneraliDocumento></DatiGenerali>'
  );
}

function paymentBlock(document: DocumentDto): string {
  if (!document.paymentMeansCode) return '';
  const modalita = PAYMENT_MEANS_TO_MODALITA[document.paymentMeansCode] ?? 'MP05';
  return (
    '<DatiPagamento>' +
    el('CondizioniPagamento', 'TP02') +
    '<DettaglioPagamento>' +
    el('ModalitaPagamento', modalita) +
    (document.dueAt ? el('DataScadenzaPagamento', dateOnly(document.dueAt)) : '') +
    el('ImportoPagamento', toAmountString(document.amount)) +
    (document.issuer.iban ? el('IBAN', document.issuer.iban) : '') +
    '</DettaglioPagamento>' +
    '</DatiPagamento>'
  );
}

export function toFatturaPaXml(document: DocumentDto): string {
  const kind = assertFatturaPaEligible(document.documentType);

  const header =
    '<FatturaElettronicaHeader>' +
    transmissionBlock(document) +
    cedentePrestatoreBlock(document.issuer) +
    cessionarioCommittenteBlock(document.recipient) +
    '</FatturaElettronicaHeader>';

  const body =
    '<FatturaElettronicaBody>' +
    generalDataBlock(document, kind) +
    beniServiziBlock(document) +
    paymentBlock(document) +
    '</FatturaElettronicaBody>';

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<p:FatturaElettronica xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" versione="FPR12">' +
    header +
    body +
    '</p:FatturaElettronica>'
  );
}
