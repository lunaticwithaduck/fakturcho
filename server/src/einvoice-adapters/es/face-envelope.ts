import { escapeXml } from './xml';

const FACE_NS = 'https://webservice.face.gob.es';

function envelope(bodyContent: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<soapenv:Header></soapenv:Header>' +
    `<soapenv:Body>${bodyContent}</soapenv:Body>` +
    '</soapenv:Envelope>'
  );
}

export interface EnviarFacturaFields {
  correo: string;
  facturaBase64: string;
  facturaFileName: string;
  facturaMime: string;
}

export function buildEnviarFacturaEnvelope(fields: EnviarFacturaFields): string {
  const body =
    `<ns1:enviarFactura xmlns:ns1="${FACE_NS}">` +
    '<request xsi:type="ns1:EnviarFacturaRequest">' +
    `<correo xsi:type="xsd:string">${escapeXml(fields.correo)}</correo>` +
    '<factura xsi:type="ns1:FacturaFile">' +
    `<factura xsi:type="xsd:string">${fields.facturaBase64}</factura>` +
    `<nombre xsi:type="xsd:string">${escapeXml(fields.facturaFileName)}</nombre>` +
    `<mime xsi:type="xsd:string">${escapeXml(fields.facturaMime)}</mime>` +
    '</factura>' +
    '<anexos xsi:nil="true"/>' +
    '</request>' +
    '</ns1:enviarFactura>';
  return envelope(body);
}

export function buildConsultarFacturaEnvelope(numeroRegistro: string): string {
  const body =
    `<ns1:consultarFactura xmlns:ns1="${FACE_NS}">` +
    `<numeroRegistro xsi:type="xsd:string">${escapeXml(numeroRegistro)}</numeroRegistro>` +
    '</ns1:consultarFactura>';
  return envelope(body);
}
