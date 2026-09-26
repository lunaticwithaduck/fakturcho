import type { DocumentDto } from '@fakturcho/shared-types';
import { computeRegistroAltaHuella } from './aeat-huella';
import { ddmmyyyy, madridTimestamp } from './aeat-time';
import { invoiceSeriesNumber } from './es-invoice-id';
import { taxIdOf } from './facturae-parties';
import { desgloseBlock } from './verifactu-desglose';
import { destinatarioBlock } from './verifactu-destinatario';
import {
  sistemaInformaticoBlock,
  type VerifactuSoftwareIdentity,
} from './verifactu-sistema-informatico';
import { sf } from './verifactu-xml';
import { toDecimalString } from './xml';

export type { VerifactuSoftwareIdentity } from './verifactu-sistema-informatico';

export interface VerifactuChainLink {
  idEmisorFactura: string;
  numSerieFactura: string;
  fechaExpedicionFactura: string;
  huella: string;
}

export interface RegistroAltaBuild {
  xml: string;
  chainLink: VerifactuChainLink;
}

function descripcionOperacion(document: DocumentDto): string {
  const names = document.lineItems.map((line) => line.name).join('; ');
  const description = names.trim() !== '' ? names : 'Operación comercial';
  return description.length > 500 ? description.slice(0, 500) : description;
}

function encadenamientoBlock(previous: VerifactuChainLink | null): string {
  if (!previous) {
    return '<sf:Encadenamiento><sf:PrimerRegistro>S</sf:PrimerRegistro></sf:Encadenamiento>';
  }
  return (
    '<sf:Encadenamiento><sf:RegistroAnterior>' +
    sf('IDEmisorFactura', previous.idEmisorFactura) +
    sf('NumSerieFactura', previous.numSerieFactura) +
    sf('FechaExpedicionFactura', previous.fechaExpedicionFactura) +
    sf('Huella', previous.huella) +
    '</sf:RegistroAnterior></sf:Encadenamiento>'
  );
}

// Credit notes are submitted as R1 without FacturasRectificadas: the DocumentDto
// snapshot only carries `originalDocumentId`, not the original's own issued series
// number/date, so the rectified-invoice reference cannot be built here yet. See AEAT.md.
function tipoFactura(document: DocumentDto, destinatarioIdentified: boolean): 'F1' | 'F2' | 'R1' {
  if (document.documentType === 'credit_note') return 'R1';
  return destinatarioIdentified ? 'F1' : 'F2';
}

export function buildRegistroAlta(
  document: DocumentDto,
  previous: VerifactuChainLink | null,
  system: VerifactuSoftwareIdentity,
  generatedAt: Date,
): RegistroAltaBuild {
  const idEmisorFactura = taxIdOf(document.issuer.eik, document.issuer.vatNumber);
  const numSerieFactura = invoiceSeriesNumber(document);
  const fechaExpedicionFactura = document.issuedAt ? ddmmyyyy(document.issuedAt) : '';
  const destinatario = destinatarioBlock(document);
  const tipo = tipoFactura(document, destinatario.identified);
  const cuotaTotal = toDecimalString(document.vatAmount);
  // Same sign as the printed total and the QR's importe: negative for a
  // credit note (rectificativa por diferencias negativas).
  const importeSign = document.documentType === 'credit_note' ? -1 : 1;
  const importeTotal = toDecimalString(document.amount * importeSign);
  const fechaHoraHusoGenRegistro = madridTimestamp(generatedAt);

  const huella = computeRegistroAltaHuella({
    idEmisorFactura,
    numSerieFactura,
    fechaExpedicionFactura,
    tipoFactura: tipo,
    cuotaTotal,
    importeTotal,
    huellaAnterior: previous?.huella ?? '',
    fechaHoraHusoGenRegistro,
  });

  const fechaOperacion =
    document.taxEventAt && document.taxEventAt.slice(0, 10) !== document.issuedAt?.slice(0, 10)
      ? sf('FechaOperacion', ddmmyyyy(document.taxEventAt))
      : '';

  const xml =
    '<sf:RegistroAlta>' +
    sf('IDVersion', '1.0') +
    '<sf:IDFactura>' +
    sf('IDEmisorFactura', idEmisorFactura) +
    sf('NumSerieFactura', numSerieFactura) +
    sf('FechaExpedicionFactura', fechaExpedicionFactura) +
    '</sf:IDFactura>' +
    sf('NombreRazonEmisor', document.issuer.companyName ?? '') +
    sf('TipoFactura', tipo) +
    fechaOperacion +
    sf('DescripcionOperacion', descripcionOperacion(document)) +
    (destinatario.identified ? `<sf:Destinatarios>${destinatario.xml}</sf:Destinatarios>` : '') +
    desgloseBlock(document) +
    sf('CuotaTotal', cuotaTotal) +
    sf('ImporteTotal', importeTotal) +
    encadenamientoBlock(previous) +
    sistemaInformaticoBlock(system) +
    sf('FechaHoraHusoGenRegistro', fechaHoraHusoGenRegistro) +
    sf('TipoHuella', '01') +
    sf('Huella', huella) +
    '</sf:RegistroAlta>';

  return {
    xml,
    chainLink: { idEmisorFactura, numSerieFactura, fechaExpedicionFactura, huella },
  };
}
