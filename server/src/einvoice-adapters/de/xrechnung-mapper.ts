import type { DocumentDto } from '@fakturcho/shared-types';
import { toUblXml } from '../../einvoice/ubl-mapper';

export const XRECHNUNG_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0';

export interface ToXRechnungXmlOptions {
  leitwegId?: string;
}

export function toXRechnungXml(document: DocumentDto, options: ToXRechnungXmlOptions = {}): string {
  const effectiveDocument: DocumentDto = options.leitwegId
    ? { ...document, buyerReference: options.leitwegId }
    : document;

  const ublXml = toUblXml(effectiveDocument);

  return ublXml.replace(
    /<cbc:CustomizationID>[^<]*<\/cbc:CustomizationID>/,
    `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
  );
}
