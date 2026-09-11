import { textEl } from './xml';

const SF_NS =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd';
const SFLR_NS =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd';
const SFLRC_NS =
  'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/ConsultaLR.xsd';

function cabeceraBlock(issuerNombreRazon: string, issuerNif: string): string {
  return (
    '<sf:Cabecera>' +
    '<sf:ObligadoEmision>' +
    textEl('sf:NombreRazon', issuerNombreRazon) +
    textEl('sf:NIF', issuerNif) +
    '</sf:ObligadoEmision>' +
    '</sf:Cabecera>'
  );
}

export function buildRegFactuEnvelope(
  issuerNombreRazon: string,
  issuerNif: string,
  registroAltaXml: string,
): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soapenv:Body>' +
    `<sfLR:RegFactuSistemaFacturacion xmlns:sfLR="${SFLR_NS}" xmlns:sf="${SF_NS}">` +
    cabeceraBlock(issuerNombreRazon, issuerNif) +
    `<sfLR:RegistroFactura>${registroAltaXml}</sfLR:RegistroFactura>` +
    '</sfLR:RegFactuSistemaFacturacion>' +
    '</soapenv:Body>' +
    '</soapenv:Envelope>'
  );
}

export function buildConsultaEnvelope(
  issuerNombreRazon: string,
  issuerNif: string,
  ejercicio: string,
  periodo: string,
  numSerieFactura: string,
  fechaExpedicionFactura: string,
): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soapenv:Body>' +
    `<sfLRC:ConsultaFactuSistemaFacturacion xmlns:sfLRC="${SFLRC_NS}" xmlns:sf="${SF_NS}">` +
    '<sf:Cabecera>' +
    textEl('sf:IDVersion', '1.0') +
    '<sf:ObligadoEmision>' +
    textEl('sf:NombreRazon', issuerNombreRazon) +
    textEl('sf:NIF', issuerNif) +
    '</sf:ObligadoEmision>' +
    '</sf:Cabecera>' +
    '<sf:FiltroConsulta>' +
    '<sf:PeriodoImputacion>' +
    textEl('sf:Ejercicio', ejercicio) +
    textEl('sf:Periodo', periodo) +
    '</sf:PeriodoImputacion>' +
    textEl('sf:NumSerieFactura', numSerieFactura) +
    `<sf:FechaExpedicionFactura>${textEl('sf:FechaExpedicionFactura', fechaExpedicionFactura)}</sf:FechaExpedicionFactura>` +
    '</sf:FiltroConsulta>' +
    '</sfLRC:ConsultaFactuSistemaFacturacion>' +
    '</soapenv:Body>' +
    '</soapenv:Envelope>'
  );
}
