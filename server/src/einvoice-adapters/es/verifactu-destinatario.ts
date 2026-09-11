import type { DocumentDto } from '@fakturcho/shared-types';
import { taxIdOf } from './facturae-parties';
import { sf } from './verifactu-xml';

export interface Destinatario {
  xml: string;
  identified: boolean;
}

export function destinatarioBlock(document: DocumentDto): Destinatario {
  const recipient = document.recipient;
  const nombreRazon = recipient.companyName ?? '';
  const country = (recipient.country ?? 'ES').toUpperCase();

  if (country === 'ES') {
    const nif = taxIdOf(recipient.eik, recipient.vatNumber);
    if (!nif) return { xml: '', identified: false };
    return {
      identified: true,
      xml:
        '<sf:IDDestinatario>' +
        sf('NombreRazon', nombreRazon) +
        sf('NIF', nif) +
        '</sf:IDDestinatario>',
    };
  }

  const idOtro = recipient.vatNumber
    ? { idType: '02', id: recipient.vatNumber }
    : recipient.eik
      ? { idType: '04', id: recipient.eik }
      : null;
  if (!idOtro) return { xml: '', identified: false };
  return {
    identified: true,
    xml:
      '<sf:IDDestinatario>' +
      sf('NombreRazon', nombreRazon) +
      '<sf:IDOtro>' +
      sf('CodigoPais', country) +
      sf('IDType', idOtro.idType) +
      sf('ID', idOtro.id) +
      '</sf:IDOtro>' +
      '</sf:IDDestinatario>',
  };
}
