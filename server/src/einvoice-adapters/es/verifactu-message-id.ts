// providerMessageId carries the CSV plus the invoice identity checkStatus needs to
// build a ConsultaFactuSistemaFacturacion request (Verifactu has no "look up by CSV").
const MESSAGE_ID_SEP = '|';

export interface DecodedVerifactuMessageId {
  csv: string;
  idEmisorFactura: string;
  numSerieFactura: string;
  fecha: string;
}

export function encodeVerifactuMessageId(
  csv: string,
  idEmisorFactura: string,
  numSerieFactura: string,
  fecha: string,
): string {
  return [csv, idEmisorFactura, numSerieFactura, fecha].join(MESSAGE_ID_SEP);
}

export function decodeVerifactuMessageId(
  providerMessageId: string,
): DecodedVerifactuMessageId | null {
  const parts = providerMessageId.split(MESSAGE_ID_SEP);
  if (parts.length !== 4) return null;
  const [csv, idEmisorFactura, numSerieFactura, fecha] = parts as [string, string, string, string];
  return { csv, idEmisorFactura, numSerieFactura, fecha };
}
