import { extractBlocks, extractTagText } from './soap-xml';

const ACCEPTED_ESTADO_REGISTRO = new Set(['Correcto', 'AceptadoConErrores']);
const ACCEPTED_ESTADO_REGISTRO_SF = new Set(['Correcta', 'AceptadaConErrores']);

export interface RegFactuOutcome {
  accepted: boolean;
  admissible: boolean;
  csv: string | null;
  estadoEnvio: string | null;
  estadoRegistro: string | null;
  codigoError: string | null;
  descripcionError: string | null;
}

export function parseRegFactuResponse(body: string): RegFactuOutcome {
  const estadoEnvio = extractTagText(body, 'EstadoEnvio');
  const [linea] = extractBlocks(body, 'RespuestaLinea');
  const estadoRegistro = linea ? extractTagText(linea, 'EstadoRegistro') : null;
  const codigoError = linea ? extractTagText(linea, 'CodigoErrorRegistro') : null;
  const descripcionError = linea ? extractTagText(linea, 'DescripcionErrorRegistro') : null;
  const csv = extractTagText(body, 'CSV');
  const accepted = estadoRegistro !== null && ACCEPTED_ESTADO_REGISTRO.has(estadoRegistro);

  return {
    accepted,
    admissible: estadoRegistro === 'AceptadoConErrores',
    csv,
    estadoEnvio,
    estadoRegistro,
    codigoError,
    descripcionError,
  };
}

export interface ConsultaOutcome {
  found: boolean;
  accepted: boolean;
  cancelled: boolean;
  descripcion: string | undefined;
}

export function parseConsultaResponse(body: string): ConsultaOutcome {
  const resultado = extractTagText(body, 'ResultadoConsulta');
  if (resultado === 'SinDatos') {
    return { found: false, accepted: false, cancelled: false, descripcion: undefined };
  }

  // <EstadoRegistro> wraps a same-named leaf <EstadoRegistro>state</EstadoRegistro>;
  // the enum literal disambiguates the leaf from its wrapper for a regex extractor.
  const estadoMatch =
    /<(?:[\w.-]+:)?EstadoRegistro>(Correcta|AceptadaConErrores|Anulada)<\/(?:[\w.-]+:)?EstadoRegistro>/.exec(
      body,
    );
  const estado = estadoMatch?.[1] ?? null;
  const descripcion = extractTagText(body, 'DescripcionErrorRegistro') ?? undefined;

  return {
    found: true,
    accepted: estado !== null && ACCEPTED_ESTADO_REGISTRO_SF.has(estado),
    cancelled: estado === 'Anulada',
    descripcion,
  };
}
