import { describe, expect, it } from 'vitest';
import { parseConsultaResponse, parseRegFactuResponse } from './verifactu-response';

describe('parseRegFactuResponse', () => {
  it('reads CSV and an accepted Correcto line', () => {
    const body =
      '<tik:RespuestaRegFactuSistemaFacturacion xmlns:tik="urn:x">' +
      '<tik:CSV>ABC123</tik:CSV><tik:EstadoEnvio>Correcto</tik:EstadoEnvio>' +
      '<tik:RespuestaLinea><tik:EstadoRegistro>Correcto</tik:EstadoRegistro></tik:RespuestaLinea>' +
      '</tik:RespuestaRegFactuSistemaFacturacion>';

    const outcome = parseRegFactuResponse(body);

    expect(outcome).toMatchObject({
      accepted: true,
      admissible: false,
      csv: 'ABC123',
      estadoEnvio: 'Correcto',
    });
  });

  it('flags AceptadoConErrores as accepted-but-admissible', () => {
    const body =
      '<tik:EstadoEnvio>ParcialmenteCorrecto</tik:EstadoEnvio>' +
      '<tik:RespuestaLinea><tik:EstadoRegistro>AceptadoConErrores</tik:EstadoRegistro>' +
      '<tik:DescripcionErrorRegistro>minor</tik:DescripcionErrorRegistro></tik:RespuestaLinea>';

    const outcome = parseRegFactuResponse(body);

    expect(outcome.accepted).toBe(true);
    expect(outcome.admissible).toBe(true);
    expect(outcome.descripcionError).toBe('minor');
  });

  it('reports not accepted for Incorrecto with an error code', () => {
    const body =
      '<tik:EstadoEnvio>Incorrecto</tik:EstadoEnvio>' +
      '<tik:RespuestaLinea><tik:EstadoRegistro>Incorrecto</tik:EstadoRegistro>' +
      '<tik:CodigoErrorRegistro>1234</tik:CodigoErrorRegistro>' +
      '<tik:DescripcionErrorRegistro>bad NIF</tik:DescripcionErrorRegistro></tik:RespuestaLinea>';

    const outcome = parseRegFactuResponse(body);

    expect(outcome.accepted).toBe(false);
    expect(outcome.codigoError).toBe('1234');
    expect(outcome.descripcionError).toBe('bad NIF');
  });
});

describe('parseConsultaResponse', () => {
  it('reports not found for SinDatos', () => {
    expect(
      parseConsultaResponse('<tik:ResultadoConsulta>SinDatos</tik:ResultadoConsulta>'),
    ).toEqual({
      found: false,
      accepted: false,
      cancelled: false,
      descripcion: undefined,
    });
  });

  it('reports accepted for a Correcta leaf nested in its EstadoRegistro wrapper', () => {
    const body =
      '<tik:ResultadoConsulta>ConDatos</tik:ResultadoConsulta>' +
      '<tik:EstadoRegistro><tik:EstadoRegistro>Correcta</tik:EstadoRegistro></tik:EstadoRegistro>';

    expect(parseConsultaResponse(body)).toMatchObject({
      found: true,
      accepted: true,
      cancelled: false,
    });
  });

  it('reports cancelled for Anulada', () => {
    const body =
      '<tik:ResultadoConsulta>ConDatos</tik:ResultadoConsulta>' +
      '<tik:EstadoRegistro><tik:EstadoRegistro>Anulada</tik:EstadoRegistro></tik:EstadoRegistro>';

    expect(parseConsultaResponse(body)).toMatchObject({
      found: true,
      accepted: false,
      cancelled: true,
    });
  });
});
