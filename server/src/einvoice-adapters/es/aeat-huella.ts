import { createHash } from 'node:crypto';

export interface RegistroAltaHuellaFields {
  idEmisorFactura: string;
  numSerieFactura: string;
  fechaExpedicionFactura: string;
  tipoFactura: string;
  cuotaTotal: string;
  importeTotal: string;
  huellaAnterior: string;
  fechaHoraHusoGenRegistro: string;
}

export interface RegistroAnulacionHuellaFields {
  idEmisorFacturaAnulada: string;
  numSerieFacturaAnulada: string;
  fechaExpedicionFacturaAnulada: string;
  huellaAnterior: string;
  fechaHoraHusoGenRegistro: string;
}

function field(name: string, value: string): string {
  return `${name}=${value}`;
}

// Concatenation order and format fixed by the AEAT spec (Veri-Factu_especificaciones_huella_hash_registros.pdf, §3).
export function huellaAltaInput(fields: RegistroAltaHuellaFields): string {
  return [
    field('IDEmisorFactura', fields.idEmisorFactura),
    field('NumSerieFactura', fields.numSerieFactura),
    field('FechaExpedicionFactura', fields.fechaExpedicionFactura),
    field('TipoFactura', fields.tipoFactura),
    field('CuotaTotal', fields.cuotaTotal),
    field('ImporteTotal', fields.importeTotal),
    field('Huella', fields.huellaAnterior),
    field('FechaHoraHusoGenRegistro', fields.fechaHoraHusoGenRegistro),
  ].join('&');
}

export function huellaAnulacionInput(fields: RegistroAnulacionHuellaFields): string {
  return [
    field('IDEmisorFacturaAnulada', fields.idEmisorFacturaAnulada),
    field('NumSerieFacturaAnulada', fields.numSerieFacturaAnulada),
    field('FechaExpedicionFacturaAnulada', fields.fechaExpedicionFacturaAnulada),
    field('Huella', fields.huellaAnterior),
    field('FechaHoraHusoGenRegistro', fields.fechaHoraHusoGenRegistro),
  ].join('&');
}

export function computeHuella(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').toUpperCase();
}

export function computeRegistroAltaHuella(fields: RegistroAltaHuellaFields): string {
  return computeHuella(huellaAltaInput(fields));
}

export function computeRegistroAnulacionHuella(fields: RegistroAnulacionHuellaFields): string {
  return computeHuella(huellaAnulacionInput(fields));
}
